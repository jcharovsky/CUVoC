type Point = { day: string; conversations: number; negative: number };

function pathFor(data: Point[], key: "conversations" | "negative", max: number) {
  return data
    .map((point, index) => {
      const x = 24 + (index * 752) / (data.length - 1);
      const y = 186 - (point[key] / max) * 150;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export function VolumeChart({ data }: { data: Point[] }) {
  const max = 1650;
  const totalPath = pathFor(data, "conversations", max);
  const negativePath = pathFor(data, "negative", max);

  return (
    <div className="chart-wrap">
      <div className="chart-legend" aria-hidden="true">
        <span><i className="legend-dot legend-total" />All conversations</span>
        <span><i className="legend-dot legend-negative" />Negative sentiment</span>
      </div>
      <svg className="trend-chart" viewBox="0 0 800 230" role="img" aria-label="Conversation volume trend">
        {[36, 86, 136, 186].map((y) => <line key={y} x1="24" x2="776" y1={y} y2={y} className="grid-line" />)}
        <path d={`${totalPath} L776,186 L24,186 Z`} className="chart-area" />
        <path d={totalPath} className="chart-line chart-line-total" />
        <path d={negativePath} className="chart-line chart-line-negative" />
        {data.map((point, index) => {
          const x = 24 + (index * 752) / (data.length - 1);
          return (
            <g key={point.day}>
              <text x={x} y="218" textAnchor="middle" className="axis-label">{point.day.replace("Apr ", "").replace("May ", "May ")}</text>
              <circle cx={x} cy={186 - (point.conversations / max) * 150} r="3.5" className="chart-point" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
