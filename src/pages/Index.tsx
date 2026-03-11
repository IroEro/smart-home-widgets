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
    try {
      const devs = await fetchDevices();
      setDevices(devs);
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleScan() {
    setScanning(true);
    try {
      const devs = await discoverDevices();
      setDevices(devs);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
    }
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
        className="relative pt-6 pb-3 px-4 overflow-hidden"
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Thermometer className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-semibold text-foreground text-base">EWPE Smart</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center transition active:scale-90 hover:bg-secondary"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-foreground", scanning && "animate-spin")} />
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center transition active:scale-90 hover:bg-secondary"
              >
                <Settings className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-2">
            <div className="glass rounded-lg px-3 py-1.5 flex-1 flex items-center justify-center gap-1.5">
              <Wifi className="w-3 h-3 text-primary" />
              <span className="text-base font-semibold font-mono text-foreground">{onlineCount}</span>
              <span className="text-[11px] text-muted-foreground">Online</span>
            </div>
            <div className="glass rounded-lg px-3 py-1.5 flex-1 flex items-center justify-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", activeCount > 0 ? "bg-primary animate-pulse" : "bg-muted")} />
              <span className="text-base font-semibold font-mono text-foreground">{activeCount}</span>
              <span className="text-[11px] text-muted-foreground">Running</span>
            </div>
            <div className="glass rounded-lg px-3 py-1.5 flex-1 flex items-center justify-center gap-1.5">
              <span className="text-base font-semibold font-mono text-foreground">{devices.length}</span>
              <span className="text-[11px] text-muted-foreground">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device list */}
      <div className="flex-1 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Devices
          </h2>
          {scanning && (
            <span className="text-xs text-primary animate-pulse">Scanning…</span>
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
