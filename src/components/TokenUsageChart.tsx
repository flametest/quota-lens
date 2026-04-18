interface TokenPoint {
  label: string;
  value: number;
}

interface Props {
  points: TokenPoint[];
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
}

function getTickIndices(length: number): number[] {
  if (length <= 1) return [0];
  const indices = [0, Math.floor((length - 1) / 2), length - 1];
  return [...new Set(indices)];
}

function formatTimeLabel(label: string): string {
  const parts = label.split(" ");
  if (parts.length !== 2) return label;
  const [date] = parts;
  return date;
}

export default function TokenUsageChart({ points }: Props) {
  if (!points.length) {
    return (
      <div
        className="h-[128px] rounded-xl flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          近 7 天暂无可用曲线数据
        </span>
      </div>
    );
  }

  const width = 280;
  const height = 128;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const minValue = 0;
  const yTicks = [maxValue, maxValue / 2, 0];

  const getX = (index: number) =>
    padding.left + (chartWidth * index) / Math.max(points.length - 1, 1);
  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(point.value)}`)
    .join(" ");

  const areaPath = `${linePath} L ${getX(points.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;
  const xTickIndices = getTickIndices(points.length);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="rounded-xl p-2"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)" }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[128px] overflow-visible">
          {yTicks.map((tick, index) => {
            const y = getY(tick);
            return (
              <g key={`${tick}-${index}`}>
                <line
                  x1={padding.left}
                  x2={padding.left + chartWidth}
                  y1={y}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeDasharray={index === yTicks.length - 1 ? "0" : "3 4"}
                  strokeWidth="1"
                />
                <text
                  x={padding.left + 4}
                  y={y - 4}
                  fontSize="9"
                  fill="var(--text-tertiary)"
                >
                  {formatAxisValue(tick)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="var(--accent)" opacity="0.12" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point, index) => (
            <circle
              key={`${point.label}-${index}`}
              cx={getX(index)}
              cy={getY(point.value)}
              r="2"
              fill="var(--accent)"
            />
          ))}

          {xTickIndices.map((index) => (
            <text
              key={index}
              x={getX(index)}
              y={height - 6}
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              fontSize="9"
              fill="var(--text-tertiary)"
            >
              {formatTimeLabel(points[index].label)}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-tertiary)" }}>
        <span>近 7 天每小时 token 消耗</span>
        <span>峰值 {formatAxisValue(maxValue)}</span>
      </div>
    </div>
  );
}
