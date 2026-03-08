import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDevices, setDeviceState, AcDevice, discoverDevices } from "@/lib/ewpe-service";
import { DeviceCard } from "@/components/DeviceCard";
import { Wifi, RefreshCw, Settings, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import bgHero from "@/assets/bg-hero.jpg";

export default function Index() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<AcDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const devs = await fetchDevices();
    setDevices(devs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleScan() {
    setScanning(true);
    const devs = await discoverDevices();
    setDevices(devs);
    setScanning(false);
  }

  async function handleTogglePower(e: React.MouseEvent, device: AcDevice) {
    e.stopPropagation();
    if (!device.online) return;
    const updated = await setDeviceState(device.id, { power: !device.state.power });
    setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  const onlineCount = devices.filter((d) => d.online).length;
  const activeCount = devices.filter((d) => d.online && d.state.power).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero header */}
      <div
        className="relative pt-10 pb-8 px-5 overflow-hidden"
        style={{
          backgroundImage: `url(${bgHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />

        <div className="relative z-10">
          {/* App bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground text-lg">EWPE Smart</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center transition active:scale-90 hover:bg-secondary"
              >
                <RefreshCw className={cn("w-4 h-4 text-foreground", scanning && "animate-spin")} />
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center transition active:scale-90 hover:bg-secondary"
              >
                <Settings className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="glass rounded-xl px-4 py-3 flex-1 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Wifi className="w-3.5 h-3.5 text-primary" />
                <span className="text-2xl font-semibold font-mono text-foreground">{onlineCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex-1 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <div className={cn("w-2 h-2 rounded-full", activeCount > 0 ? "bg-primary animate-pulse" : "bg-muted")} />
                <span className="text-2xl font-semibold font-mono text-foreground">{activeCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">Running</span>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex-1 text-center">
              <span className="text-2xl font-semibold font-mono text-foreground">{devices.length}</span>
              <div className="text-xs text-muted-foreground mt-0.5">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Device list */}
      <div className="flex-1 px-5 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Devices
          </h2>
          {scanning && (
            <span className="text-xs text-primary animate-pulse">Scanning network…</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Wifi className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">No devices found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Make sure your EWPE Smart devices are on the same network
              </p>
            </div>
            <button
              onClick={handleScan}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition"
            >
              Scan Network
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() => navigate(`/device/${device.id}`)}
                onTogglePower={(e) => handleTogglePower(e, device)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
