import { AcDevice, FanSpeed } from "@/lib/ewpe-service";
import { ModeBadge } from "./ModeBadge";
import { Power, Wifi, WifiOff, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const FAN_BARS: Record<FanSpeed, number> = {
  auto:   0,
  low:    1,
  medium: 2,
  high:   3,
  turbo:  4,
};

function FanSpeedIcon({ speed, active }: { speed: FanSpeed; active: boolean }) {
  const bars = FAN_BARS[speed];
  if (speed === "auto") {
    return <Wind className={cn("w-[15px] h-[15px] shrink-0", active ? "text-primary" : "text-muted-foreground")} strokeWidth={2} />;
  }
  return (
    <div className="flex items-end gap-px h-[15px]">
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className={cn(
            "w-[3px] rounded-sm",
            b <= bars
              ? active ? "bg-primary" : "bg-muted-foreground"
              : "bg-muted"
          )}
          style={{ height: `${b * 3 + 2}px` }}
        />
      ))}
    </div>
  );
}

interface DeviceCardProps {
  device: AcDevice;
  onPress: () => void;
  onTogglePower: (e: React.MouseEvent) => void;
}

export function DeviceCard({ device, onPress, onTogglePower }: DeviceCardProps) {
  const { state, online } = device;
  const isActive = state.power && online;

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
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{device.name}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{device.model}</p>
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
              <FanIcon className="w-[15px] h-[15px] shrink-0" strokeWidth={2} />
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
