import { Theme } from "../../hooks/useTheme";

interface Props {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const options: { value: Theme; label: string; desc: string }[] = [
  { value: "system", label: "跟随系统", desc: "自动匹配 macOS 外观设置" },
  { value: "light", label: "浅色", desc: "明亮风格" },
  { value: "dark", label: "深色", desc: "暗黑风格" },
];

export default function ThemeConfigPanel({ theme, setTheme }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        外观
      </h3>

      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className="card flex items-center gap-3 text-left transition-all"
          style={{
            border: theme === opt.value ? "2px solid var(--accent)" : "2px solid transparent",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "var(--bg-tertiary)" }}
          >
            {opt.value === "light" ? "☀️" : opt.value === "dark" ? "🌙" : "🖥️"}
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {opt.label}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {opt.desc}
            </div>
          </div>
          {theme === opt.value && (
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <path d="M8.5 2.5L4 7L1.5 4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
