import { AcMode } from "@/lib/ewpe-service";
import { cn } from "@/lib/utils";
import { Snowflake, Flame, Droplets, Wind, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MODE_BG: Record<AcMode, string> = {
  cool: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  heat: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  dry:  "bg-purple-500/10 border-purple-500/30 text-purple-400",
  fan:  "bg-teal-500/10 border-teal-500/30 text-teal-400",
  auto: "bg-green-500/10 border-green-500/30 text-green-400",
};

const MODE_ICON: Record<AcMode, LucideIcon> = {
  cool: Snowflake,
  heat: Flame,
  dry:  Droplets,
  fan:  Wind,
  auto: Zap,
};

interface ModeBadgeProps {
  mode: AcMode;
  className?: string;
}

export function ModeBadge({ mode, className }: ModeBadgeProps) {
  const labels: Record<AcMode, string> = {
    cool: "Cool",
    heat: "Heat",
    dry: "Dry",
    fan: "Fan",
    auto: "Auto",
  };

  const Icon = MODE_ICON[mode];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[13px] font-medium",
        MODE_BG[mode],
        className
      )}
    >
      <Icon className="w-[15px] h-[15px] shrink-0" strokeWidth={2.5} />
      {labels[mode]}
    </span>
  );
}

const MODE_COLORS: Record<AcMode, string> = {
  cool: "from-blue-500 to-cyan-400",
  heat: "from-orange-500 to-amber-400",
  dry:  "from-purple-500 to-violet-400",
  fan:  "from-teal-500 to-cyan-400",
  auto: "from-green-500 to-emerald-400",
};

export { MODE_COLORS };
