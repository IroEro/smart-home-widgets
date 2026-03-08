import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TemperatureDialProps {
  value: number;
  min?: number;
  max?: number;
  mode?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function TemperatureDial({
  value,
  min = 16,
  max = 30,
  mode = "cool",
  disabled = false,
  onChange,
}: TemperatureDialProps) {
  const SIZE = 220;
  const STROKE = 12;
  const R = (SIZE - STROKE) / 2;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  // Arc goes from 135° to 405° (270° sweep)
  const START_ANGLE = 135;
  const END_ANGLE = 405;
  const SWEEP = END_ANGLE - START_ANGLE;

  const progress = (value - min) / (max - min);
  const angle = START_ANGLE + progress * SWEEP;

  function polarToXY(deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: CX + R * Math.cos(rad),
      y: CY + R * Math.sin(rad),
    };
  }

  function describeArc(startDeg: number, endDeg: number) {
    const s = polarToXY(startDeg);
    const e = polarToXY(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const handlePoint = polarToXY(angle);

  const modeColors: Record<string, { track: string; progress: string; handle: string }> = {
    cool: {
      track: "hsl(220,30%,20%)",
      progress: "url(#grad-cool)",
      handle: "hsl(210,90%,60%)",
    },
    heat: {
      track: "hsl(220,30%,20%)",
      progress: "url(#grad-heat)",
      handle: "hsl(38,90%,55%)",
    },
    dry: {
      track: "hsl(220,30%,20%)",
      progress: "url(#grad-dry)",
      handle: "hsl(270,60%,65%)",
    },
    fan: {
      track: "hsl(220,30%,20%)",
      progress: "url(#grad-fan)",
      handle: "hsl(185,80%,48%)",
    },
    auto: {
      track: "hsl(220,30%,20%)",
      progress: "url(#grad-auto)",
      handle: "hsl(140,60%,50%)",
    },
  };

  const colors = modeColors[mode] || modeColors.cool;

  const svgRef = useRef<SVGSVGElement>(null);

  function getAngleFromEvent(cx: number, cy: number, clientX: number, clientY: number) {
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return deg;
  }

  function angleToValue(deg: number) {
    // Normalize to our arc range
    let normalized = deg - START_ANGLE;
    if (normalized < 0) normalized += 360;
    if (normalized > SWEEP) normalized = normalized > SWEEP + 90 ? 0 : SWEEP;
    const p = normalized / SWEEP;
    return Math.round(min + p * (max - min));
  }

  function handleInteraction(clientX: number, clientY: number) {
    if (disabled || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const deg = getAngleFromEvent(cx, cy, clientX, clientY);
    const newVal = angleToValue(deg);
    if (newVal >= min && newVal <= max) onChange(newVal);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (e.buttons !== 1) return;
    handleInteraction(e.clientX, e.clientY);
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
  }

  return (
    <div className="relative select-none">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={cn("dial-ring", disabled && "opacity-40")}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
        onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
      >
        <defs>
          <linearGradient id="grad-cool" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(185,80%,48%)" />
            <stop offset="100%" stopColor="hsl(210,90%,60%)" />
          </linearGradient>
          <linearGradient id="grad-heat" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(20,90%,48%)" />
            <stop offset="100%" stopColor="hsl(38,90%,55%)" />
          </linearGradient>
          <linearGradient id="grad-dry" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(260,60%,55%)" />
            <stop offset="100%" stopColor="hsl(270,60%,65%)" />
          </linearGradient>
          <linearGradient id="grad-fan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(175,80%,40%)" />
            <stop offset="100%" stopColor="hsl(185,80%,55%)" />
          </linearGradient>
          <linearGradient id="grad-auto" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(130,60%,45%)" />
            <stop offset="100%" stopColor="hsl(150,60%,55%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d={describeArc(START_ANGLE, END_ANGLE)}
          fill="none"
          stroke={colors.track}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {progress > 0 && (
          <path
            d={describeArc(START_ANGLE, angle)}
            fill="none"
            stroke={colors.progress}
            strokeWidth={STROKE}
            strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* Tick marks */}
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const tickAngle = START_ANGLE + (i / (max - min)) * SWEEP;
          const inner = polarToXY(tickAngle);
          const outerR = R + 8;
          const outerRad = ((tickAngle - 90) * Math.PI) / 180;
          const outer = {
            x: CX + outerR * Math.cos(outerRad),
            y: CY + outerR * Math.sin(outerRad),
          };
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={i === Math.round(progress * (max - min)) ? colors.handle : "hsl(220,25%,25%)"}
              strokeWidth={i % 5 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Handle */}
        <circle
          cx={handlePoint.x}
          cy={handlePoint.y}
          r={STROKE / 2 + 2}
          fill={colors.handle}
          filter="url(#glow)"
          className="cursor-grab active:cursor-grabbing"
        />
        <circle
          cx={handlePoint.x}
          cy={handlePoint.y}
          r={STROKE / 2 - 2}
          fill="hsl(220,30%,8%)"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-5xl font-light font-mono text-foreground glow-text">{value}</div>
        <div className="text-lg text-muted-foreground">°C</div>
      </div>
    </div>
  );
}
