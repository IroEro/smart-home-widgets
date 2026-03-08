import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Server, Wifi, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const [bridgeUrl, setBridgeUrl] = useState("");
  const [pollInterval, setPollInterval] = useState("5000");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In a real app, persist to storage / Capacitor Preferences
    localStorage.setItem("ewpe_bridge_url", bridgeUrl);
    localStorage.setItem("ewpe_poll_interval", pollInterval);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center transition hover:bg-secondary active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground text-lg">Settings</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Bridge config */}
        <section className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Bridge Connection</h2>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">
              Bridge URL
            </label>
            <input
              type="text"
              value={bridgeUrl}
              onChange={(e) => setBridgeUrl(e.target.value)}
              placeholder="http://192.168.1.100:3000"
              className={cn(
                "w-full bg-secondary/60 border border-border/50 rounded-xl px-4 py-3",
                "text-foreground placeholder:text-muted-foreground text-sm font-mono",
                "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
              )}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              IP address of your ewpe-smart-mqtt bridge on your local network
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">
              Poll Interval (ms)
            </label>
            <input
              type="number"
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
              className={cn(
                "w-full bg-secondary/60 border border-border/50 rounded-xl px-4 py-3",
                "text-foreground text-sm font-mono",
                "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
              )}
            />
          </div>
        </section>

        {/* Network info */}
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Network Discovery</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EWPE Smart devices are discovered via UDP broadcast on your local network (port 7000).
            The bridge service handles device communication — you only need to configure its HTTP URL above.
          </p>
        </section>

        {/* Setup guide */}
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Bridge Setup</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Install Docker or Node.js on your home server / Raspberry Pi</p>
            <p>2. Run the bridge:</p>
            <pre className="bg-background/60 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto">
{`docker run -it --network="host" \\
  -e "NETWORK=192.168.1.255" \\
  demydiuk/ewpe-smart-mqtt`}
            </pre>
            <p>3. Set the bridge URL above and tap Save</p>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={cn(
            "w-full py-4 rounded-xl font-semibold transition-all duration-200 active:scale-95",
            saved
              ? "bg-green-500/20 border border-green-500/40 text-green-400"
              : "bg-primary text-primary-foreground glow-primary hover:opacity-90"
          )}
        >
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
