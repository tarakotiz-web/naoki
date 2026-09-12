"use client";

import { useId, useMemo, useState } from "react";

export interface BarDatum {
  label: string;
  value: number;
}

const AZURE = "#0a7cff";
const HEIGHT = 180;
const BAR_MAX_THICKNESS = 24;
const RADIUS = 4;

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** 単一系列の縦棒グラフ。data-vizスキルの仕様(細い棒・上端4px丸め・ヘアラインの目盛り・ホバー)に準拠。 */
export function VerticalBarChart({
  data,
  color = AZURE,
  valueSuffix = "",
  formatLabel,
}: {
  data: BarDatum[];
  color?: string;
  valueSuffix?: string;
  formatLabel?: (label: string, index: number) => string;
}) {
  const id = useId();
  const [showTable, setShowTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.value), 1)), [data]);
  const width = Math.max(data.length * 36, 280);
  const bandWidth = width / Math.max(data.length, 1);
  const barWidth = Math.min(BAR_MAX_THICKNESS, bandWidth * 0.6);

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  // 棒が多い場合は目盛りラベルを間引く
  const labelStride = Math.ceil(data.length / 12);

  return (
    <div>
      <div className="overflow-x-auto scroll-touch">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT + 28}`}
          width="100%"
          height={HEIGHT + 28}
          style={{ minWidth: Math.min(width, 640) }}
          role="img"
          aria-label="棒グラフ"
        >
          {gridSteps.map((s) => {
            const y = HEIGHT - HEIGHT * s;
            return (
              <line
                key={s}
                x1={0}
                x2={width}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
            );
          })}
          {data.map((d, i) => {
            const x = i * bandWidth + (bandWidth - barWidth) / 2;
            const h = Math.max((d.value / max) * HEIGHT, d.value > 0 ? 3 : 0);
            const top = HEIGHT - h;
            const r = Math.min(RADIUS, h);
            const path =
              h <= 0
                ? ""
                : `M${x},${HEIGHT} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + barWidth - r},${top} Q${x + barWidth},${top} ${x + barWidth},${top + r} L${x + barWidth},${HEIGHT} Z`;
            const isHovered = hover === i;
            return (
              <g key={i}>
                <rect
                  x={i * bandWidth}
                  y={0}
                  width={bandWidth}
                  height={HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.value}${valueSuffix}`}
                />
                {path && (
                  <path d={path} fill={color} opacity={isHovered ? 1 : 0.85} pointerEvents="none" />
                )}
                {i % labelStride === 0 && (
                  <text
                    x={i * bandWidth + bandWidth / 2}
                    y={HEIGHT + 18}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--foreground-muted)"
                  >
                    {formatLabel ? formatLabel(d.label, i) : d.label}
                  </text>
                )}
                {isHovered && (
                  <g pointerEvents="none">
                    <rect
                      x={Math.min(Math.max(i * bandWidth + bandWidth / 2 - 34, 0), width - 68)}
                      y={Math.max(top - 26, 0)}
                      width={68}
                      height={20}
                      rx={6}
                      fill="var(--foreground)"
                    />
                    <text
                      x={Math.min(Math.max(i * bandWidth + bandWidth / 2, 34), width - 34)}
                      y={Math.max(top - 12, 14)}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill="var(--surface)"
                    >
                      {d.label}: {d.value}
                      {valueSuffix}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <button
        onClick={() => setShowTable((v) => !v)}
        className="text-xs text-[var(--color-azure)] font-semibold mt-1"
      >
        {showTable ? "表を閉じる" : "表で見る"}
      </button>
      {showTable && (
        <table className="w-full text-xs mt-2 border-t border-[var(--border)]">
          <tbody>
            {data.map((d, i) => (
              <tr key={`${id}-${i}`} className="border-b border-[var(--border)]">
                <td className="py-1 pr-2 text-[var(--foreground-muted)]">{d.label}</td>
                <td className="py-1 text-right font-semibold tabular-nums">
                  {d.value}
                  {valueSuffix}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
