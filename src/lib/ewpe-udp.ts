/**
 * EWPE Smart – Direct UDP Transport
 *
 * Uses capacitor-udp to communicate directly with EWPE/Gree devices on the LAN.
 * Falls back gracefully when the plugin is unavailable (web/PWA).
 *
 * Flow per operation:
 *   scan      → broadcast scan → collect responses for SCAN_TIMEOUT ms
 *   bind      → unicast bind to device IP → wait for key response
 *   getStatus → unicast status req → wait for status response
 *   setParams → unicast cmd → wait for ack
 */

import { Capacitor } from "@capacitor/core";
import {
  GENERIC_KEY,
  DEVICE_PORT,
  buildScanPacket,
  buildBindPacket,
  buildStatusPacket,
  buildCommandPacket,
  decryptPack,
  STATUS_COLS,
  PROTO_TO_MODE,
  PROTO_TO_FANSPEED,
  PROTO_TO_SWING,
  MODE_TO_PROTO,
  FANSPEED_TO_PROTO,
  SWING_TO_PROTO,
  type AcMode,
  type FanSpeed,
  type SwingMode,
} from "./ewpe-protocol";
import type { AcDevice, AcState } from "./ewpe-service";

// ── Plugin import (dynamic, graceful) ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _udp: any = null;

async function getUdp() {
  if (_udp) return _udp;
  // capacitor-udp exports UDP as the plugin instance
  const mod = await import("@frontall/capacitor-udp");
  _udp = (mod as any).UdpPlugin ?? (mod as any).default?.UdpPlugin ?? mod.UDP ?? (mod as any).default ?? mod;
  return _udp;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Global broadcast – works on most networks */
const BROADCAST = "255.255.255.255";
/** Subnet broadcast fallback, configurable in Settings */
function getSubnetBroadcast(): string {
  return localStorage.getItem("ewpe_subnet_broadcast")?.trim() || "192.168.1.255";
}
const SCAN_TIMEOUT_MS = 5000;
const CMD_TIMEOUT_MS = 8000;
/** Hard safety cap so the scan always terminates */
const MAX_SCAN_MS = 10000;

// ── Session key store (in-memory, persisted across calls) ────────────────────

const deviceKeys = new Map<string, string>(); // mac → session key

// ── Buffer utils ─────────────────────────────────────────────────────────────

/** Encode UTF-8 string → base64 for capacitor-udp send */
function encodeBuffer(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** Decode base64 buffer received from capacitor-udp → UTF-8 string */
function decodeBuffer(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── Core UDP helpers ─────────────────────────────────────────────────────────

/** Open a socket, run fn, then close it. Returns fn result. */
async function withSocket<T>(
  fn: (socketId: number, udp: ReturnType<typeof getUdp> extends Promise<infer U> ? U : never) => Promise<T>
): Promise<T> {
  const udp = await getUdp();
  const { socketId } = await udp.create({ properties: { name: `ewpe-${Date.now()}`, bufferSize: 4096 } });
  try {
    return await fn(socketId, udp);
  } finally {
    try { await udp.close({ socketId }); } catch { /* ignore */ }
  }
}

/**
 * Send scan packets to multiple broadcast addresses and collect all responses.
 * Sends to both 255.255.255.255 and 192.168.1.255 to handle routers that
 * block the global broadcast address.
 */
async function sendAndCollect(
  addresses: string[],
  packet: string,
  timeoutMs: number,
): Promise<Array<{ data: Record<string, unknown>; remoteAddress: string; rawOuter: Record<string, unknown> }>> {
  return withSocket(async (socketId, udp) => {
    await udp.bind({ socketId, address: "0.0.0.0", port: DEVICE_PORT });
    await udp.setBroadcast({ socketId, enabled: true });

    const results: Array<{ data: Record<string, unknown>; remoteAddress: string; rawOuter: Record<string, unknown> }> = [];
    const seenMacs = new Set<string>();

    const handle = await udp.addListener("receive", (event: { socketId: number; buffer: string; remoteAddress: string }) => {
      if (event.socketId !== socketId) return;
      try {
        const str = decodeBuffer(event.buffer);
        const outer = JSON.parse(str) as Record<string, unknown>;
        let data: Record<string, unknown>;
        if (outer.pack) {
          const key = deviceKeys.get(outer.cid as string) ?? GENERIC_KEY;
          data = decryptPack(outer.pack as string, key);
        } else {
          data = outer;
        }
        // Deduplicate by MAC so dual-broadcast doesn't double-add
        const mac = (data.mac ?? outer.mac ?? event.remoteAddress) as string;
        if (seenMacs.has(mac)) return;
        seenMacs.add(mac);
        results.push({ data, remoteAddress: event.remoteAddress, rawOuter: outer });
        console.log("[EWPE] scan response from", event.remoteAddress, data);
      } catch (e) {
        console.warn("[EWPE] malformed scan packet", e);
      }
    });

    // Send to every broadcast address; errors on one don't abort the others
    for (const addr of addresses) {
      try {
        await udp.send({ socketId, address: addr, port: DEVICE_PORT, buffer: encodeBuffer(packet) });
        console.log("[EWPE] scan sent to", addr);
      } catch (e) {
        console.warn("[EWPE] send to", addr, "failed:", e);
      }
    }

    // Race: wait for timeout OR hard cap
    await Promise.race([
      new Promise((r) => setTimeout(r, timeoutMs)),
      new Promise((r) => setTimeout(r, MAX_SCAN_MS)),
    ]);
    handle.remove();

    return results;
  });
}

/**
 * Send a packet and wait for the first matching response.
 * bind → addListener → send to avoid missing early responses.
 */
async function sendAndWait(
  address: string,
  packet: string,
  match: (data: Record<string, unknown>) => boolean,
  key?: string
): Promise<Record<string, unknown>> {
  return withSocket(async (socketId, udp) => {
    // Bind first so the socket is ready before we send
    await udp.bind({ socketId, address: "0.0.0.0", port: DEVICE_PORT });

    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("UDP timeout")), CMD_TIMEOUT_MS);

      let handle: { remove: () => void } | null = null;

      udp.addListener("receive", (event: { socketId: number; buffer: string; remoteAddress: string }) => {
        if (event.socketId !== socketId) return;
        try {
          const str = decodeBuffer(event.buffer);
          const outer = JSON.parse(str) as Record<string, unknown>;
          let data: Record<string, unknown>;
          if (outer.pack) {
            const k = key ?? deviceKeys.get(outer.cid as string) ?? GENERIC_KEY;
            data = decryptPack(outer.pack as string, k);
          } else {
            data = outer;
          }
          if (match(data)) {
            clearTimeout(timer);
            handle?.remove();
            resolve(data);
          }
        } catch { /* ignore */ }
      }).then((h) => {
        handle = h;
        // Send only after listener is registered
        udp.send({ socketId, address, port: DEVICE_PORT, buffer: encodeBuffer(packet) })
          .catch((err: Error) => { clearTimeout(timer); reject(err); });
      }).catch((err: Error) => { clearTimeout(timer); reject(err); });
    });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/** True when we're on a native platform where UDP is available */
export function isDirectUdpAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/** Scan the LAN for EWPE Smart devices */
export async function udpScanDevices(): Promise<AcDevice[]> {
  const results = await sendAndCollect(
    [BROADCAST, getSubnetBroadcast()],
    buildScanPacket(),
    SCAN_TIMEOUT_MS,
  );

  const devices: AcDevice[] = [];

  for (const { data, remoteAddress } of results) {
    if (!data.mac) continue;
    const mac = data.mac as string;

    // Bind to get the session key
    try {
      await udpBindDevice(mac, remoteAddress);
    } catch {
      continue; // skip devices we can't bind
    }

    const key = deviceKeys.get(mac);
    if (!key) continue;

    // Fetch initial status
    let state: AcState;
    try {
      state = await udpGetDeviceState(mac, remoteAddress, key);
    } catch {
      state = defaultState();
    }

    devices.push({
      id: `ac_${mac.replace(/:/g, "").toLowerCase()}`,
      name: (data.name as string | undefined) ?? `AC ${mac.slice(-5)}`,
      model: (data.brand as string | undefined) ?? "EWPE Smart",
      ip: remoteAddress,
      mac,
      online: true,
      state,
    });
  }

  return devices;
}

/** Bind a device and store its session key */
async function udpBindDevice(mac: string, ip: string): Promise<string> {
  const packet = buildBindPacket(mac);
  const resp = await sendAndWait(ip, packet, (d) => d.t === "bindok");
  const key = resp.key as string;
  deviceKeys.set(mac, key);
  return key;
}

/** Fetch current state from a device */
async function udpGetDeviceState(mac: string, ip: string, key: string): Promise<AcState> {
  const packet = buildStatusPacket(mac, key);
  const resp = await sendAndWait(ip, packet, (d) => d.t === "dat", key);

  const cols = resp.cols as string[];
  const dat = resp.dat as number[];
  const vals: Record<string, number> = {};
  cols.forEach((c, i) => { vals[c] = dat[i]; });

  return protoToState(vals);
}

/** Fetch full device by id from a stored device list (used by service layer) */
export async function udpFetchDevice(id: string, devices: AcDevice[]): Promise<AcDevice | undefined> {
  const device = devices.find((d) => d.id === id);
  if (!device) return undefined;

  let key = deviceKeys.get(device.mac);
  if (!key) {
    try {
      key = await udpBindDevice(device.mac, device.ip);
    } catch {
      return { ...device, online: false };
    }
  }

  try {
    const state = await udpGetDeviceState(device.mac, device.ip, key);
    return { ...device, state, online: true };
  } catch {
    return { ...device, online: false };
  }
}

/** Apply a state patch to a device and return the updated device */
export async function udpSetDeviceState(
  device: AcDevice,
  patch: Partial<AcState>
): Promise<AcDevice> {
  let key = deviceKeys.get(device.mac);
  if (!key) {
    key = await udpBindDevice(device.mac, device.ip);
  }

  const opts = stateToProtoOpts(patch);
  if (Object.keys(opts).length > 0) {
    const packet = buildCommandPacket(device.mac, key, opts);
    await sendAndWait(device.ip, packet, (d) => d.t === "res", key);
  }

  const newState = { ...device.state, ...patch };
  return { ...device, state: newState };
}

// ── State converters ─────────────────────────────────────────────────────────

function defaultState(): AcState {
  return {
    power: false, targetTemp: 24, currentTemp: 24,
    mode: "cool", fanSpeed: "auto", swing: "off",
    sleep: false, turbo: false, light: false, health: false, quietMode: false,
  };
}

function protoToState(v: Record<string, number>): AcState {
  return {
    power: v["Pow"] === 1,
    targetTemp: v["SetTem"] ?? 24,
    currentTemp: v["TemSen"] ?? v["SetTem"] ?? 24,
    mode: (PROTO_TO_MODE[v["Mod"]] as AcMode) ?? "auto",
    fanSpeed: (PROTO_TO_FANSPEED[v["WdSpd"]] as FanSpeed) ?? "auto",
    swing: (PROTO_TO_SWING[v["SwUpDn"]] as SwingMode) ?? "off",
    sleep: v["SwhSlp"] === 1,
    turbo: v["Tur"] === 1,
    light: v["Lig"] === 1,
    health: v["Health"] === 1,
    quietMode: v["Quiet"] === 1,
  };
}

function stateToProtoOpts(patch: Partial<AcState>): Record<string, number> {
  const opts: Record<string, number> = {};
  if (patch.power !== undefined)    opts["Pow"]      = patch.power ? 1 : 0;
  if (patch.targetTemp !== undefined) opts["SetTem"] = patch.targetTemp;
  if (patch.mode !== undefined)     opts["Mod"]      = MODE_TO_PROTO[patch.mode];
  if (patch.fanSpeed !== undefined) opts["WdSpd"]    = FANSPEED_TO_PROTO[patch.fanSpeed];
  if (patch.swing !== undefined)    opts["SwUpDn"]   = SWING_TO_PROTO[patch.swing];
  if (patch.sleep !== undefined)    opts["SwhSlp"]   = patch.sleep ? 1 : 0;
  if (patch.turbo !== undefined)    opts["Tur"]      = patch.turbo ? 1 : 0;
  if (patch.light !== undefined)    opts["Lig"]      = patch.light ? 1 : 0;
  if (patch.health !== undefined)   opts["Health"]   = patch.health ? 1 : 0;
  if (patch.quietMode !== undefined) opts["Quiet"]   = patch.quietMode ? 1 : 0;
  return opts;
}
