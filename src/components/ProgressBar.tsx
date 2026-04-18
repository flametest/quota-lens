export default function ProgressBar({ percentage }: { percentage: number }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const color =
    clamped >= 100 ? "#ff3b30"
    : clamped >= 80 ? "#ff9500"
    : clamped >= 20 ? "#007aff"
    : "#34c759";

  return (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{ background: "var(--progress-bg)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
