/**
 * EWPE Smart / Gree AC UDP Protocol
 *
 * Packet encryption uses AES-128-ECB with PKCS7 padding and Base64 encoding.
 * The generic key is used for scan + bind; thereafter each device has its own key.
 *
 * Protocol reference: https://github.com/tomikaa87/gree-remote
 */

import CryptoJS from "crypto-js";

export const GENERIC_KEY = "a3K8Bx%2r8Y7#xDh";
export const DEVICE_PORT = 7000;

// ── Encryption helpers ────────────────────────────────────────────────────────

export function encryptPack(data: object, key: string = GENERIC_KEY): string {
  const json = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(json),
    CryptoJS.enc.Utf8.parse(key),
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  return encrypted.toString();
}

export function decryptPack(
  pack: string,
  key: string = GENERIC_KEY
): Record<string, unknown> {
  const decrypted = CryptoJS.AES.decrypt(pack, CryptoJS.enc.Utf8.parse(key), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}

// ── Packet builders ───────────────────────────────────────────────────────────

/** Broadcast scan packet – no encryption */
export function buildScanPacket(): string {
  return JSON.stringify({ t: "scan" });
}

/** Bind request: sent to a specific device to receive its session key */
export function buildBindPacket(mac: string): string {
  const pack = encryptPack({ t: "bind", uid: 0, mac });
  return JSON.stringify({ cid: "app", i: 1, t: "pack", uid: 0, tcid: mac, pack });
}

/** Status request: ask device for all parameter values */
export function buildStatusPacket(mac: string, key: string): string {
  const pack = encryptPack(
    { t: "status", uid: 0, mac, cols: STATUS_COLS },
    key
  );
  return JSON.stringify({ cid: "app", i: 0, t: "pack", uid: 0, tcid: mac, pack });
}

/** Command packet: set one or more parameters */
export function buildCommandPacket(
  mac: string,
  key: string,
  opts: Record<string, number>
): string {
  const opt = Object.keys(opts);
  const p = opt.map((k) => opts[k]);
  const pack = encryptPack({ t: "cmd", uid: 0, opt, p }, key);
  return JSON.stringify({ cid: "app", i: 0, t: "pack", uid: 0, tcid: mac, pack });
}

// ── Column names used for status requests ────────────────────────────────────

export const STATUS_COLS = [
  "Pow", "SetTem", "TemSen", "WdSpd", "Mod",
  "SwUpDn", "SwingLfRig", "SwhSlp", "Tur", "Lig", "Health", "Quiet",
];

// ── Value maps: protocol integer ↔ app enum ──────────────────────────────────

export type AcMode = "cool" | "heat" | "dry" | "fan" | "auto";
export type FanSpeed = "auto" | "low" | "medium" | "high" | "turbo";
export type SwingMode = "off" | "vertical" | "horizontal" | "both";

export const MODE_TO_PROTO: Record<AcMode, number> = {
  auto: 0, cool: 1, dry: 2, fan: 3, heat: 4,
};
export const PROTO_TO_MODE: Record<number, AcMode> = {
  0: "auto", 1: "cool", 2: "dry", 3: "fan", 4: "heat",
};

export const FANSPEED_TO_PROTO: Record<FanSpeed, number> = {
  auto: 0, low: 1, medium: 2, high: 3, turbo: 4,
};
export const PROTO_TO_FANSPEED: Record<number, FanSpeed> = {
  0: "auto", 1: "low", 2: "medium", 3: "high", 4: "turbo", 5: "auto",
};

// SwUpDn: 0=off, 1=full-auto, 2-6=fixed positions → we map to off/vertical
export const SWING_TO_PROTO: Record<SwingMode, number> = {
  off: 0, vertical: 1, horizontal: 0, both: 1,
};
export const PROTO_TO_SWING: Record<number, SwingMode> = {
  0: "off", 1: "vertical", 2: "vertical", 3: "vertical",
  4: "vertical", 5: "vertical", 6: "vertical",
};
