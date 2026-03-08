/**
 * EWPE Smart Bridge Service
 *
 * Communicates with the ewpe-smart-mqtt bridge via HTTP REST.
 * The bridge URL is read at call-time from localStorage so Settings
 * changes take effect immediately without a reload.
 *
 * On Android native the bridge can run locally via Termux — no
 * separate server required. Default localhost URL: http://localhost:3000
 *
 * To connect to real devices:
 *  1. Install Termux on your Android device
 *  2. Run the ewpe-smart-mqtt bridge inside Termux (see Settings → Bridge Setup)
 *  3. Set Bridge URL to http://localhost:3000 in Settings and tap Save
 *
 * Current mode: MOCK when no bridge URL is configured.
 */

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

// ====== MOCK DATA ======
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

// In-memory state for mock
let mockDevices = JSON.parse(JSON.stringify(MOCK_DEVICES)) as AcDevice[];

// ====== Runtime bridge config ======
// Read from localStorage at each call so Settings changes are instant.
function getBridgeUrl(): string {
  return localStorage.getItem("ewpe_bridge_url")?.trim() ?? "";
}

function getPollInterval(): number {
  return parseInt(localStorage.getItem("ewpe_poll_interval") ?? "5000", 10);
}

export { getPollInterval };

// ====== API functions ======

export async function fetchDevices(): Promise<AcDevice[]> {
  const url = getBridgeUrl();
  if (!url) {
    await delay(400);
    return JSON.parse(JSON.stringify(mockDevices));
  }
  const res = await fetch(`${url}/devices`);
  if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
  return res.json();
}

export async function fetchDevice(id: string): Promise<AcDevice | undefined> {
  const url = getBridgeUrl();
  if (!url) {
    await delay(200);
    return JSON.parse(JSON.stringify(mockDevices.find((d) => d.id === id)));
  }
  const res = await fetch(`${url}/devices/${id}`);
  if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
  return res.json();
}

export async function setDeviceState(
  id: string,
  patch: Partial<AcState>
): Promise<AcDevice> {
  const url = getBridgeUrl();
  if (!url) {
    await delay(150);
    const device = mockDevices.find((d) => d.id === id);
    if (!device) throw new Error("Device not found");
    device.state = { ...device.state, ...patch };
    return JSON.parse(JSON.stringify(device));
  }
  const res = await fetch(`${url}/devices/${id}/state`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
  return res.json();
}

export async function discoverDevices(): Promise<AcDevice[]> {
  const url = getBridgeUrl();
  if (!url) {
    await delay(1500);
    return JSON.parse(JSON.stringify(mockDevices));
  }
  const res = await fetch(`${url}/scan`);
  if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
  return res.json();
}

/** Ping the bridge and return true if reachable */
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

/** True when a bridge URL has been configured */
export function hasBridgeUrl(): boolean {
  return getBridgeUrl().length > 0;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mode metadata helpers
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
