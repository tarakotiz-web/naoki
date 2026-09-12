"use client";

import { useState } from "react";
import type { BarDatum } from "./vertical-bar-chart";

const AZURE = "#0a7cff";
const ROW_HEIGHT = 28;
const BAR_THICKNESS = 16;
const RADIUS = 4;
const LABEL_WIDTH = 92;

/** 単一系列の横棒グラフ(ランキング表示向け)。値はバーの先端に直接ラベルする。 */
export function HorizontalBarChart({
  data,
  color = AZURE,
  valueSuffix = "",
}: {
  data: BarDatum[];
  color?: string;
  valueSuffix?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartWidth = 240;
  const width = LABEL_WIDTH + chartWidth + 44;
  const height = data.length * ROW_HEIGHT;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="横棒グラフ">
      {data.map((d, i) => {
        const y = i * ROW_HEIGHT + (ROW_HEIGHT - BAR_THICKNESS) / 2;
        const w = Math.max((d.value / max) * chartWidth, d.value > 0 ? 3 : 0);
        const r = Math.min(RADIUS, w);
        const x0 = LABEL_WIDTH;
        const path =
          w <= 0
            ? ""
            : `M${x0},${y} L${x0 + w - r},${y} Q${x0 + w},${y} ${x0 + w},${y + r} L${x0 + w},${y + BAR_THICKNESS - r} Q${x0 + w},${y + BAR_THICKNESS} ${x0 + w - r},${y + BAR_THICKNESS} L${x0},${y + BAR_THICKNESS} Z`;
        const isHovered = hover === i;
        return (
          <g
            key={d.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            tabIndex={0}
            aria-label={`${d.label}: ${d.value}${valueSuffix}`}
          >
            <rect x={0} y={i * ROW_HEIGHT} width={width} height={ROW_HEIGHT} fill="transparent" />
            <text
              x={LABEL_WIDTH - 8}
              y={i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
              textAnchor="end"
              fontSize={12}
              fontWeight={600}
              fill="var(--foreground)"
            >
              {d.label}
            </text>
            {path && <path d={path} fill={color} opacity={isHovered ? 1 : 0.85} />}
            <text
              x={x0 + w + 8}
              y={i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
              fontSize={12}
              fontWeight={700}
              fill="var(--foreground-muted)"
            >
              {d.value}
              {valueSuffix}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
