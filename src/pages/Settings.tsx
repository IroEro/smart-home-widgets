import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Server, Wifi, Info, Radio, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

export default function Settings() {
  const navigate = useNavigate();
  const [bridgeUrl, setBridgeUrl] = useState("");
  const [pollInterval, setPollInterval] = useState("5000");
  const [saved, setSaved] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);

  useEffect(() => {
    // Never default to localhost — keep empty so native uses direct UDP
    const storedUrl = localStorage.getItem("ewpe_bridge_url") ?? "";
    setBridgeUrl(storedUrl);
    setPollInterval(localStorage.getItem("ewpe_poll_interval") ?? "5000");
  }, []);

  const mode = bridgeUrl.trim() ? "bridge" : isNative ? "udp" : "mock";

  function handleSave() {
    localStorage.setItem("ewpe_bridge_url", bridgeUrl.trim());
    localStorage.setItem("ewpe_poll_interval", pollInterval);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

        {/* Active mode banner */}
        <div className={cn(
          "flex items-start gap-3 rounded-xl p-4 border",
          mode === "udp"    && "bg-primary/10 border-primary/20",
          mode === "bridge" && "bg-yellow-500/10 border-yellow-500/20",
          mode === "mock"   && "bg-secondary/60 border-border/30",
        )}>
          {mode === "udp" && <Radio className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
          {mode === "bridge" && <Server className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />}
          {mode === "mock" && <Wifi className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
          <div>
            <p className={cn(
              "text-sm font-semibold",
              mode === "udp"    && "text-primary",
              mode === "bridge" && "text-yellow-400",
              mode === "mock"   && "text-muted-foreground",
            )}>
              {mode === "udp"    && "Direct UDP — no bridge needed"}
              {mode === "bridge" && "HTTP Bridge mode"}
              {mode === "mock"   && "Demo mode (mock data)"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {mode === "udp"    && "The app communicates directly with your AC units over your local Wi-Fi network."}
              {mode === "bridge" && "All commands are routed through the bridge URL below."}
              {mode === "mock"   && "No real devices — running in browser or no bridge configured."}
            </p>
          </div>
        </div>

        {/* Network Discovery */}
        <section className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Network Discovery</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isNative
              ? "Tap the refresh button on the home screen to scan your Wi-Fi network for EWPE / Gree AC units (UDP port 7000). The app handles encryption and device binding automatically."
              : "Install the app on Android to enable direct UDP discovery of EWPE / Gree AC units on your local network."}
          </p>
        </section>

        {/* Poll interval */}
        <section className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Polling</h2>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">
              Status Poll Interval (ms)
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

        {/* Optional Bridge — collapsible */}
        <section className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setBridgeOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Optional: HTTP Bridge</h2>
            </div>
            {bridgeOpen
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {bridgeOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-border/30">
              <p className="pt-3 text-sm text-muted-foreground">
                Leave blank to use direct UDP (recommended for Android). Only fill this in if you want to route through an external <span className="font-mono text-foreground/70">ewpe-smart-mqtt</span> bridge.
              </p>
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
              </div>
              {bridgeUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setBridgeUrl("")}
                  className="text-xs text-destructive underline underline-offset-2"
                >
                  Clear (switch back to direct UDP)
                </button>
              )}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Run on a Raspberry Pi, NAS, or Docker host on your LAN:</p>
                <pre className="bg-background/60 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
{`docker run -it --network="host" \\
  -e "NETWORK=192.168.1.255" \\
  demydiuk/ewpe-smart-mqtt`}
                </pre>
              </div>
            </div>
          )}
        </section>

        {/* About */}
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">About</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EWPE Smart controls Gree / EWPE air conditioners directly over your local Wi-Fi using the native UDP protocol — no cloud, no subscription.
          </p>
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
