import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchDevice,
  setDeviceState,
  AcDevice,
  AcMode,
  FanSpeed,
} from "@/lib/ewpe-service";
import { TemperatureDial } from "@/components/TemperatureDial";
import { ModeSelector, FanSpeedSelector, ToggleRow } from "@/components/AcControls";
import { ModeBadge } from "@/components/ModeBadge";
import {
  ArrowLeft, Power, Moon, Zap, Lightbulb, Heart, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<AcDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchDevice(id).then((d) => {
      if (d) setDevice(d);
      setLoading(false);
    });
  }, [id]);

  async function update(patch: Parameters<typeof setDeviceState>[1]) {
    if (!device) return;
    setSaving(true);
    const updated = await setDeviceState(device.id, patch);
    setDevice(updated);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <p className="text-muted-foreground">Device not found</p>
        <button onClick={() => navigate("/")} className="text-primary underline">Go back</button>
      </div>
    );
  }

  const { state } = device;
  const isActive = state.power && device.online;

  return (
    <div className="min-h-screen flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center transition hover:bg-secondary active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-foreground">{device.name}</h1>
          <p className="text-xs text-muted-foreground">{device.model}</p>
        </div>
        {/* Power */}
        <button
          onClick={() => update({ power: !state.power })}
          disabled={!device.online || saving}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border",
            isActive
              ? "bg-primary border-primary/50 text-primary-foreground glow-primary"
              : "bg-secondary border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Dial */}
      <div className="flex flex-col items-center py-6">
        <TemperatureDial
          value={state.targetTemp}
          mode={state.mode}
          disabled={!isActive}
          onChange={(temp) => update({ targetTemp: temp })}
        />
        <div className="flex items-center gap-3 mt-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Set</div>
            <div className="font-mono text-foreground font-medium">{state.targetTemp}°C</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Room</div>
            <div className="font-mono text-foreground font-medium">{state.currentTemp}°C</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Mode</div>
            <ModeBadge mode={state.mode} />
          </div>
        </div>

        {/* Temp +/- buttons */}
        <div className="flex items-center gap-6 mt-5">
          <button
            onClick={() => update({ targetTemp: Math.max(16, state.targetTemp - 1) })}
            disabled={!isActive || state.targetTemp <= 16}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-2xl font-light text-foreground active:scale-90 transition disabled:opacity-30"
          >
            −
          </button>
          <div className="text-xs text-muted-foreground">16° — 30°</div>
          <button
            onClick={() => update({ targetTemp: Math.min(30, state.targetTemp + 1) })}
            disabled={!isActive || state.targetTemp >= 30}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-2xl font-light text-foreground active:scale-90 transition disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 px-5 space-y-5">

        {/* Mode */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Mode</h2>
          <ModeSelector
            value={state.mode}
            disabled={!isActive}
            onChange={(mode: AcMode) => update({ mode })}
          />
        </section>

        {/* Fan Speed */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Fan Speed</h2>
          <FanSpeedSelector
            value={state.fanSpeed}
            disabled={!isActive}
            onChange={(fanSpeed: FanSpeed) => update({ fanSpeed })}
          />
        </section>

        {/* Extra features */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Features</h2>
          <div className="space-y-2">
            <ToggleRow
              label="Sleep Mode"
              value={state.sleep}
              disabled={!isActive}
              icon={<Moon className="w-4 h-4" />}
              onChange={(v) => update({ sleep: v })}
            />
            <ToggleRow
              label="Turbo Boost"
              value={state.turbo}
              disabled={!isActive}
              icon={<Zap className="w-4 h-4" />}
              onChange={(v) => update({ turbo: v })}
            />
            <ToggleRow
              label="Health / Ion"
              value={state.health}
              disabled={!isActive}
              icon={<Heart className="w-4 h-4" />}
              onChange={(v) => update({ health: v })}
            />
            <ToggleRow
              label="Display Light"
              value={state.light}
              disabled={!isActive}
              icon={<Lightbulb className="w-4 h-4" />}
              onChange={(v) => update({ light: v })}
            />
            <ToggleRow
              label="Quiet Mode"
              value={state.quietMode}
              disabled={!isActive}
              icon={<Volume2 className="w-4 h-4" />}
              onChange={(v) => update({ quietMode: v })}
            />
          </div>
        </section>

        {/* Device info */}
        <section className="glass rounded-xl p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Device Info</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP</span>
              <span className="text-foreground">{device.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MAC</span>
              <span className="text-foreground text-xs">{device.mac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={device.online ? "text-green-400" : "text-red-400"}>
                {device.online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
