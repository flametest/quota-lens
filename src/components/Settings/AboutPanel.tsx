import { useI18n } from "../../hooks/useI18n";

export default function AboutPanel() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 animate-fade-in">
      <img src="/icon.png" alt="Quota Lens" className="w-20 h-20 rounded-2xl shadow-lg" />
      <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
        Quota Lens
      </h2>
      <p className="text-[11px] text-center max-w-[220px]" style={{ color: "var(--text-secondary)" }}>
        {t("about.desc")}
      </p>
      <div className="flex flex-col gap-2 mt-2 w-full">
        <div className="flex items-center justify-between px-4">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{t("about.version")}</span>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>0.4.0</span>
        </div>
        <div className="flex items-center justify-between px-4">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{t("about.github")}</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              (window as any).__TAURI__.core.invoke("open_url", { url: "https://github.com/flametest/quota-lens" });
            }}
            className="text-[11px] font-medium cursor-pointer"
            style={{ color: "var(--accent)" }}
          >
            github.com/flametest/quota-lens
          </a>
        </div>
        <div className="flex items-center justify-between px-4">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{t("about.author")}</span>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>flametest</span>
        </div>
      </div>
    </div>
  );
}
