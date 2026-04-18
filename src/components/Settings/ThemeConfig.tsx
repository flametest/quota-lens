import { Theme } from "../../hooks/useTheme";
import { Locale, useI18n } from "../../hooks/useI18n";
import { AppConfig } from "../../hooks/useConfig";

interface Props {
  theme: Theme;
  setTheme: (t: Theme) => void;
  config: AppConfig;
  updateNotifications: (updates: Record<string, any>) => void;
}

export default function ThemeConfigPanel({ theme, setTheme, config, updateNotifications }: Props) {
  const { t, locale, setLocale } = useI18n();

  const themeOptions: { value: Theme; label: string; desc: string }[] = [
    { value: "system", label: t("theme.system.label"), desc: t("theme.system.desc") },
    { value: "light", label: t("theme.light.label"), desc: t("theme.light.desc") },
    { value: "dark", label: t("theme.dark.label"), desc: t("theme.dark.desc") },
  ];

  const languageOptions: { value: Locale; label: string }[] = [
    { value: "zh", label: "中文" },
    { value: "en", label: "English" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Language */}
      <div>
        <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          {t("theme.language")}
        </h3>
        <div className="flex gap-2">
          {languageOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLocale(opt.value)}
              className="flex-1 card text-center text-xs font-medium py-2 transition-all"
              style={{
                border: locale === opt.value ? "2px solid var(--accent)" : "2px solid transparent",
                color: locale === opt.value ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          {t("theme.title")}
        </h3>
        {themeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className="card flex items-center gap-3 text-left transition-all w-full mb-1"
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

      {/* Tray percentage */}
      <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--border-color)" }}>
        <div className="card flex items-center justify-between">
          <div>
            <span className="text-xs font-medium block" style={{ color: "var(--text-primary)" }}>
              {t("scheduler.trayPercent")}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {t("scheduler.trayPercentDesc")}
            </span>
          </div>
          <button
            onClick={() => updateNotifications({ showTrayPercent: !config.notifications.showTrayPercent })}
            className="w-10 h-6 rounded-full relative transition-colors shrink-0"
            style={{ background: config.notifications.showTrayPercent ? "var(--success)" : "var(--bg-tertiary)" }}
          >
            <div
              className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
              style={{ left: config.notifications.showTrayPercent ? "20px" : "4px" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
