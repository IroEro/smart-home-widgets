import { AcDevice } from "@/lib/ewpe-service";
import { ModeBadge } from "./ModeBadge";
import { Power, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300 active:scale-95",
        "card-gradient animate-fade-in",
        online ? "border-border/60 hover:border-primary/30" : "border-border/30 opacity-60"
      )}
    >
      {/* Glow when on */}
      {state.power && online && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-base leading-tight">{device.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{device.model}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            {online ? (
              <Wifi className="w-3.5 h-3.5 text-primary opacity-70" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {/* Power button */}
            <button
              onClick={onTogglePower}
              disabled={!online}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                "border border-border/50",
                state.power && online
                  ? "bg-primary text-primary-foreground glow-primary animate-pulse-ring"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              )}
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Temperature display */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-4xl font-light font-mono",
                  state.power && online ? "text-foreground glow-text" : "text-muted-foreground"
                )}
              >
                {state.targetTemp}
              </span>
              <span className="text-lg text-muted-foreground">°C</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Room: <span className="text-foreground/70">{state.currentTemp}°C</span>
            </p>
          </div>

          {/* Visual temp bar */}
          {online && state.power && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-1.5 h-16 rounded-full bg-secondary overflow-hidden">
                <div
                  className="w-full rounded-full transition-all duration-500"
                  style={{
                    height: `${Math.min(100, Math.max(10, ((state.currentTemp - 16) / (35 - 16)) * 100))}%`,
                    background:
                      state.mode === "heat"
                        ? "linear-gradient(to top, hsl(38,90%,55%), hsl(20,90%,48%))"
                        : "linear-gradient(to top, hsl(185,80%,48%), hsl(210,90%,60%))",
                    marginTop: "auto",
                    display: "block",
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{state.currentTemp}°</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <ModeBadge mode={state.mode} />
          <div className="flex items-center gap-2">
            {state.fanSpeed !== "auto" && (
              <span className="text-xs text-muted-foreground capitalize">{state.fanSpeed}</span>
            )}
            {!online && (
              <span className="text-xs text-muted-foreground">Offline</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
