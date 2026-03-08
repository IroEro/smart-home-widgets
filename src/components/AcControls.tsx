import { AcMode, FanSpeed } from "@/lib/ewpe-service";
import { cn } from "@/lib/utils";
import { Wind, Snowflake, Flame, Droplets, Zap } from "lucide-react";

// ====== Mode Selector ======
interface ModeSelectorProps {
  value: AcMode;
  disabled?: boolean;
  onChange: (mode: AcMode) => void;
}

const MODES: { id: AcMode; label: string; Icon: React.ComponentType<{className?: string}> }[] = [
  { id: "cool", label: "Cool", Icon: Snowflake },
  { id: "heat", label: "Heat", Icon: Flame },
  { id: "dry",  label: "Dry",  Icon: Droplets },
  { id: "fan",  label: "Fan",  Icon: Wind },
  { id: "auto", label: "Auto", Icon: Zap },
];

const MODE_ACTIVE: Record<AcMode, string> = {
  cool: "bg-blue-500/20 border-blue-500/50 text-blue-400",
  heat: "bg-orange-500/20 border-orange-500/50 text-orange-400",
  dry:  "bg-purple-500/20 border-purple-500/50 text-purple-400",
  fan:  "bg-teal-500/20 border-teal-500/50 text-teal-400",
  auto: "bg-green-500/20 border-green-500/50 text-green-400",
};

export function ModeSelector({ value, disabled, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => !disabled && onChange(id)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all duration-200",
            "text-xs font-medium",
            value === id
              ? MODE_ACTIVE[id]
              : "border-border/40 text-muted-foreground hover:border-border bg-secondary/30",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ====== Fan Speed Selector ======
interface FanSpeedSelectorProps {
  value: FanSpeed;
  disabled?: boolean;
  onChange: (speed: FanSpeed) => void;
}

const FAN_SPEEDS: { id: FanSpeed; label: string; bars: number }[] = [
  { id: "auto",   label: "Auto",  bars: 0 },
  { id: "low",    label: "Low",   bars: 1 },
  { id: "medium", label: "Med",   bars: 2 },
  { id: "high",   label: "High",  bars: 3 },
  { id: "turbo",  label: "Turbo", bars: 4 },
];

export function FanSpeedSelector({ value, disabled, onChange }: FanSpeedSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {FAN_SPEEDS.map(({ id, label, bars }) => (
        <button
          key={id}
          onClick={() => !disabled && onChange(id)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-200",
            value === id
              ? "bg-primary/15 border-primary/40 text-primary"
              : "border-border/40 text-muted-foreground hover:border-border bg-secondary/30",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {/* Fan bars visualization */}
          <div className="flex items-end gap-px h-4">
            {id === "auto" ? (
              <Wind className="w-4 h-4" />
            ) : (
              [1, 2, 3, 4].map((b) => (
                <div
                  key={b}
                  className={cn(
                    "w-1 rounded-sm transition-all",
                    b <= bars
                      ? value === id ? "bg-primary" : "bg-muted-foreground"
                      : "bg-muted"
                  )}
                  style={{ height: `${b * 4}px` }}
                />
              ))
            )}
          </div>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ====== Toggle Row ======
interface ToggleRowProps {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}

export function ToggleRow({ label, value, disabled, onChange, icon }: ToggleRowProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={cn(
        "flex items-center justify-between w-full p-3.5 rounded-xl border transition-all duration-200",
        value
          ? "bg-primary/10 border-primary/30"
          : "bg-secondary/30 border-border/30 hover:border-border/60",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className={value ? "text-primary" : "text-muted-foreground"}>{icon}</span>}
        <span className={cn("text-sm font-medium", value ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </span>
      </div>
      <div
        className={cn(
          "w-10 h-5 rounded-full transition-all duration-300 relative",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
            value ? "left-5.5" : "left-0.5"
          )}
          style={{ left: value ? "calc(100% - 18px)" : "2px" }}
        />
      </div>
    </button>
  );
}
