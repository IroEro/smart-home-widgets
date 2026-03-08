/**
 * EWPE Smart Bridge Service
 *
 * This abstraction layer communicates with the ewpe-smart-mqtt bridge
 * (https://github.com/stas-demydiuk/ewpe-smart-mqtt) running on your
 * local network via HTTP REST.
 *
 * To connect to real devices:
 *  1. Run ewpe-smart-mqtt on a device on your LAN
 *  2. Change BRIDGE_URL to the IP of that device (e.g. http://192.168.1.100:3000)
 *  3. The bridge will auto-discover EWPE Smart devices on the network
 *
 * Current mode: MOCK (no real devices required)
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

// ====== Bridge config ======
const BRIDGE_URL = ""; // Set to e.g. "http://192.168.1.100:3000" for real devices
const USE_MOCK = !BRIDGE_URL;

// ====== API functions ======

export async function fetchDevices(): Promise<AcDevice[]> {
  if (USE_MOCK) {
    await delay(400);
    return JSON.parse(JSON.stringify(mockDevices));
  }
  const res = await fetch(`${BRIDGE_URL}/devices`);
  return res.json();
}

export async function fetchDevice(id: string): Promise<AcDevice | undefined> {
  if (USE_MOCK) {
    await delay(200);
    return JSON.parse(JSON.stringify(mockDevices.find((d) => d.id === id)));
  }
  const res = await fetch(`${BRIDGE_URL}/devices/${id}`);
  return res.json();
}

export async function setDeviceState(
  id: string,
  patch: Partial<AcState>
): Promise<AcDevice> {
  if (USE_MOCK) {
    await delay(150);
    const device = mockDevices.find((d) => d.id === id);
    if (!device) throw new Error("Device not found");
    device.state = { ...device.state, ...patch };
    return JSON.parse(JSON.stringify(device));
  }
  const res = await fetch(`${BRIDGE_URL}/devices/${id}/state`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function discoverDevices(): Promise<AcDevice[]> {
  if (USE_MOCK) {
    await delay(1500);
    return JSON.parse(JSON.stringify(mockDevices));
  }
  const res = await fetch(`${BRIDGE_URL}/scan`);
  return res.json();
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
