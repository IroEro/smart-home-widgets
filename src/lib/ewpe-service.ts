/**
 * EWPE Smart Bridge Service
 *
 * Transport priority (evaluated at call time):
 *   1. Direct UDP  – native Android + no bridge URL configured
 *   2. HTTP bridge – bridge URL is set (ewpe-smart-mqtt running locally or remotely)
 *   3. Mock data   – web / PWA / no bridge URL on non-native platforms
 */

import { Capacitor } from "@capacitor/core";

export type AcMode = "cool" | "heat" | "dry" | "fan" | "auto";
export type FanSpeed = "auto" | "low" | "medium" | "high" | "turbo";
export type SwingMode = "off" | "vertical" | "horizontal" | "both";

export interface AcDevice {
  id: string;
  name: string;
  model: string;
  ip: string;
  mac: string;
  online: boolean;
  state: AcState;
}

export interface AcState {
  power: boolean;
  targetTemp: number;
  currentTemp: number;
  mode: AcMode;
  fanSpeed: FanSpeed;
  swing: SwingMode;
  sleep: boolean;
  turbo: boolean;
  light: boolean;
  health: boolean;
  quietMode: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DEVICES: AcDevice[] = [
  {
    id: "ac_living_room",
    name: "Living Room",
    model: "Gree EWPE-24000",
    ip: "192.168.1.101",
    mac: "AA:BB:CC:DD:EE:01",
    online: true,
    state: {
      power: true,
      targetTemp: 22,
      currentTemp: 25,
      mode: "cool",
      fanSpeed: "medium",
      swing: "vertical",
      sleep: false,
      turbo: false,
      light: true,
      health: true,
      quietMode: false,
    },
  },
  {
    id: "ac_bedroom",
    name: "Bedroom",
    model: "Gree EWPE-12000",
    ip: "192.168.1.102",
    mac: "AA:BB:CC:DD:EE:02",
    online: true,
    state: {
      power: false,
      targetTemp: 20,
      currentTemp: 23,
      mode: "auto",
      fanSpeed: "auto",
      swing: "off",
      sleep: true,
      turbo: false,
      light: false,
      health: false,
      quietMode: true,
    },
  },
  {
    id: "ac_office",
    name: "Home Office",
    model: "Gree EWPE-9000",
    ip: "192.168.1.103",
    mac: "AA:BB:CC:DD:EE:03",
    online: false,
    state: {
      power: false,
      targetTemp: 24,
      currentTemp: 28,
      mode: "fan",
      fanSpeed: "high",
      swing: "both",
      sleep: false,
      turbo: false,
      light: true,
      health: false,
      quietMode: false,
    },
  },
];

let mockDevices = JSON.parse(JSON.stringify(MOCK_DEVICES)) as AcDevice[];

// ── Runtime config ────────────────────────────────────────────────────────────

function getBridgeUrl(): string {
  return localStorage.getItem("ewpe_bridge_url")?.trim() ?? "";
}

export function getPollInterval(): number {
  return parseInt(localStorage.getItem("ewpe_poll_interval") ?? "5000", 10);
}

/** True when a bridge URL has been configured */
export function hasBridgeUrl(): boolean {
  return getBridgeUrl().length > 0;
}

/** Determines active transport mode */
function getMode(): "udp" | "bridge" | "mock" {
  const url = getBridgeUrl();
  if (url) return "bridge";
  // Dynamic import check — isDirectUdpAvailable is sync
  try {
    const { isDirectUdpAvailable } = require("./ewpe-udp") as typeof import("./ewpe-udp");
    if (isDirectUdpAvailable()) return "udp";
  } catch { /* plugin not loaded yet */ }
  return "mock";
}

// Cache scanned UDP devices so fetchDevice/setDeviceState can look them up
let udpDeviceCache: AcDevice[] = [];

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchDevices(): Promise<AcDevice[]> {
  const mode = getMode();

  if (mode === "bridge") {
    const res = await fetch(`${getBridgeUrl()}/devices`);
    if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
    return res.json();
  }

  if (mode === "udp") {
    const { udpScanDevices } = await import("./ewpe-udp");
    const devices = await udpScanDevices();
    udpDeviceCache = devices;
    return devices;
  }

  // mock
  await delay(400);
  return JSON.parse(JSON.stringify(mockDevices));
}

export async function fetchDevice(id: string): Promise<AcDevice | undefined> {
  const mode = getMode();

  if (mode === "bridge") {
    const res = await fetch(`${getBridgeUrl()}/devices/${id}`);
    if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
    return res.json();
  }

  if (mode === "udp") {
    const { udpFetchDevice } = await import("./ewpe-udp");
    return udpFetchDevice(id, udpDeviceCache);
  }

  // mock
  await delay(200);
  return JSON.parse(JSON.stringify(mockDevices.find((d) => d.id === id)));
}

export async function setDeviceState(
  id: string,
  patch: Partial<AcState>
): Promise<AcDevice> {
  const mode = getMode();

  if (mode === "bridge") {
    const res = await fetch(`${getBridgeUrl()}/devices/${id}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
    return res.json();
  }

  if (mode === "udp") {
    const device = udpDeviceCache.find((d) => d.id === id);
    if (!device) throw new Error("Device not found in UDP cache – scan first");
    const { udpSetDeviceState } = await import("./ewpe-udp");
    const updated = await udpSetDeviceState(device, patch);
    udpDeviceCache = udpDeviceCache.map((d) => (d.id === id ? updated : d));
    return updated;
  }

  // mock
  await delay(150);
  const device = mockDevices.find((d) => d.id === id);
  if (!device) throw new Error("Device not found");
  device.state = { ...device.state, ...patch };
  return JSON.parse(JSON.stringify(device));
}

export async function discoverDevices(): Promise<AcDevice[]> {
  const mode = getMode();

  if (mode === "bridge") {
    const res = await fetch(`${getBridgeUrl()}/scan`);
    if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
    return res.json();
  }

  if (mode === "udp") {
    // discoverDevices triggers a fresh scan
    return fetchDevices();
  }

  // mock
  await delay(1500);
  return JSON.parse(JSON.stringify(mockDevices));
}

/** Ping the bridge and return true if reachable (bridge mode only) */
export async function pingBridge(): Promise<boolean> {
  const url = getBridgeUrl();
  if (!url) return false;
  try {
    const res = await fetch(`${url}/devices`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Mode metadata helpers ─────────────────────────────────────────────────────

export const MODE_META: Record<
  AcMode,
  { label: string; color: string; icon: string }
> = {
  cool: { label: "Cool", color: "hsl(210, 90%, 60%)", icon: "❄️" },
  heat: { label: "Heat", color: "hsl(38, 90%, 55%)", icon: "🔥" },
  dry:  { label: "Dry",  color: "hsl(270, 60%, 65%)", icon: "💧" },
  fan:  { label: "Fan",  color: "hsl(185, 80%, 48%)", icon: "🌀" },
  auto: { label: "Auto", color: "hsl(140, 60%, 50%)", icon: "⚡" },
};

export const FAN_SPEEDS: FanSpeed[] = ["auto", "low", "medium", "high", "turbo"];
