export default function TokenStats({
  today,
  week,
  month,
}: {
  today: string;
  week: string;
  month: string;
}) {
  const items = [
    { label: "今日", value: today },
    { label: "近7天", value: week },
    { label: "近30天", value: month },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1 p-2 rounded-lg"
          style={{ background: "var(--bg-secondary)" }}
        >
          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {item.label}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
