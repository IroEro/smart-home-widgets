import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Server, Wifi, Info, Terminal, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

const DEFAULT_LOCAL = "http://localhost:3000";
const isNative = Capacitor.isNativePlatform();

export default function Settings() {
  const navigate = useNavigate();
  const [bridgeUrl, setBridgeUrl] = useState("");
  const [pollInterval, setPollInterval] = useState("5000");
  const [saved, setSaved] = useState(false);
  const [termuxOpen, setTermuxOpen] = useState(false);

  // Load saved values; on native Android default to localhost
  useEffect(() => {
    const storedUrl = localStorage.getItem("ewpe_bridge_url") ?? "";
    setBridgeUrl(storedUrl || (isNative ? DEFAULT_LOCAL : ""));
    setPollInterval(localStorage.getItem("ewpe_poll_interval") ?? "5000");
  }, []);

  function handleSave() {
    localStorage.setItem("ewpe_bridge_url", bridgeUrl);
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

        {/* Native Android notice */}
        {isNative && (
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-xl p-4">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              Running as native Android app. You can run the bridge directly on this device via Termux — no separate server needed.
            </p>
          </div>
        )}

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
              placeholder={isNative ? DEFAULT_LOCAL : "http://192.168.1.100:3000"}
              className={cn(
                "w-full bg-secondary/60 border border-border/50 rounded-xl px-4 py-3",
                "text-foreground placeholder:text-muted-foreground text-sm font-mono",
                "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
              )}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {isNative
                ? "Use http://localhost:3000 if the bridge is running in Termux on this device"
                : "IP address of your ewpe-smart-mqtt bridge on your local network"}
            </p>
          </div>

          {isNative && (
            <button
              type="button"
              onClick={() => setBridgeUrl(DEFAULT_LOCAL)}
              className="text-xs text-primary underline underline-offset-2"
            >
              Use localhost (Termux on this device)
            </button>
          )}

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

        {/* Termux setup — collapsible, shown on native; always available */}
        <section className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setTermuxOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Run Bridge on This Device (Termux)
              </h2>
            </div>
            {termuxOpen
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {termuxOpen && (
            <div className="px-5 pb-5 space-y-3 text-sm text-muted-foreground border-t border-border/30">
              <p className="pt-3">
                Run the EWPE Smart bridge directly on your Android phone using Termux — no Raspberry Pi or home server needed.
              </p>
              <p className="font-medium text-foreground">1. Install Termux</p>
              <p>Download Termux from F-Droid (recommended) or Google Play.</p>

              <p className="font-medium text-foreground">2. Install Node.js in Termux</p>
              <pre className="bg-background/60 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
{`pkg update && pkg install -y nodejs
node --version`}
              </pre>

              <p className="font-medium text-foreground">3. Install and run the bridge</p>
              <pre className="bg-background/60 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
{`npm install -g ewpe-smart-mqtt
NETWORK=192.168.1.255 ewpe-smart-mqtt`}
              </pre>
              <p className="text-xs">Replace <span className="font-mono text-foreground/80">192.168.1.255</span> with your WiFi broadcast address (usually your subnet ending in .255).</p>

              <p className="font-medium text-foreground">4. Keep Termux running in background</p>
              <p>Use Termux's wake-lock notification to prevent Android from killing it. Tap the notification → <em>Acquire wakelock</em>.</p>

              <p className="font-medium text-foreground">5. Set bridge URL above</p>
              <p>Tap <em>Use localhost</em> above, then Save Settings.</p>
            </div>
          )}
        </section>

        {/* Network info */}
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Network Discovery</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EWPE Smart devices are discovered via UDP broadcast on your local network (port 7000).
            The bridge handles device communication — you only need to configure its HTTP URL above.
          </p>
        </section>

        {/* Remote bridge setup guide */}
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Remote Bridge Setup</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Run on a Raspberry Pi, NAS, or any Docker host on your LAN:</p>
            <pre className="bg-background/60 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
{`docker run -it --network="host" \\
  -e "NETWORK=192.168.1.255" \\
  demydiuk/ewpe-smart-mqtt`}
            </pre>
            <p>Then enter that device's IP as the Bridge URL above.</p>
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
