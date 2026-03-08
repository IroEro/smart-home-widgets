import { AcDevice } from "@/lib/ewpe-service";
import { ModeBadge } from "./ModeBadge";
import { Power, Wifi, WifiOff, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const FAN_ANIM: Record<string, string> = {
  auto:   "animate-fan-slow",
  low:    "animate-fan-slow",
  medium: "animate-fan",
  high:   "animate-fan",
  turbo:  "animate-fan",
};

const FAN_SPEED_STYLE: Record<string, string> = {
  auto:   "animation-duration-[4s]",
  low:    "animation-duration-[3.5s]",
  medium: "animation-duration-[1.5s]",
  high:   "animation-duration-[0.8s]",
  turbo:  "animation-duration-[0.4s]",
};

interface DeviceCardProps {
  device: AcDevice;
  onPress: () => void;
  onTogglePower: (e: React.MouseEvent) => void;
}

export function DeviceCard({ device, onPress, onTogglePower }: DeviceCardProps) {
  const { state, online } = device;

  const tempDiff = state.currentTemp - state.targetTemp;

  return (
    <div
      onClick={onPress}
      className={cn(
        "relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 active:scale-95",
        "card-gradient animate-fade-in",
        online ? "border-border/60 hover:border-primary/30" : "border-border/30 opacity-60"
      )}
    >
      {/* Glow when on */}
      {state.power && online && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{device.name}</h3>
              <p className="text-[11px] text-muted-foreground truncate">{device.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {online ? (
              <Wifi className="w-3 h-3 text-primary opacity-70" />
            ) : (
              <WifiOff className="w-3 h-3 text-muted-foreground" />
            )}
            <button
              onClick={onTogglePower}
              disabled={!online}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                "border border-border/50",
                state.power && online
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              )}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Temperature + info row */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-3xl font-light font-mono",
                state.power && online ? "text-foreground glow-text" : "text-muted-foreground"
              )}
            >
              {state.targetTemp}
            </span>
            <span className="text-sm text-muted-foreground">°C</span>
            <span className="text-[11px] text-muted-foreground ml-1">
              / {state.currentTemp}°
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ModeBadge mode={state.mode} />
            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-secondary/60 px-2.5 py-0.5 text-[13px] text-muted-foreground">
              <Wind
                className={cn(
                  "w-3 h-3 shrink-0",
                  state.power && online ? FAN_ANIM[state.fanSpeed] : ""
                )}
                style={state.power && online ? {
                  animationDuration:
                    state.fanSpeed === "turbo" ? "0.4s" :
                    state.fanSpeed === "high"  ? "0.8s" :
                    state.fanSpeed === "medium"? "1.5s" :
                    state.fanSpeed === "low"   ? "3.5s" : "4s"
                } : undefined}
              />
              <span className="capitalize">{state.fanSpeed === "auto" ? "Auto" : state.fanSpeed}</span>
            </span>
            {!online && (
              <span className="text-xs text-muted-foreground">Offline</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
