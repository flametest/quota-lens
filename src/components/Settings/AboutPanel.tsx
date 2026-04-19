import { useState } from "react";
import { useI18n } from "../../hooks/useI18n";

type UpdateStatus = "idle" | "checking" | "up_to_date" | "new_version" | "error";

export default function AboutPanel() {
  const { t } = useI18n();
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [releaseUrl, setReleaseUrl] = useState("");

  const handleCheckUpdate = async () => {
    setStatus("checking");
    try {
      const result = await (window as any).__TAURI__.core.invoke("check_update");
      if (result) {
        setReleaseUrl(result);
        setStatus("new_version");
      } else {
        setStatus("up_to_date");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleDownload = () => {
    (window as any).__TAURI__.core.invoke("open_url", { url: releaseUrl });
  };

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
          <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>0.5.2</span>
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
        <div className="flex items-center justify-center mt-3 px-4">
          {status === "idle" && (
            <button
              onClick={handleCheckUpdate}
              className="text-[11px] font-medium px-4 py-1.5 rounded-lg transition-colors"
              style={{
                color: "var(--accent)",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
              }}
            >
              {t("about.checkUpdate")}
            </button>
          )}
          {status === "checking" && (
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {t("about.checking")}
            </span>
          )}
          {status === "up_to_date" && (
            <span className="text-[11px] font-medium" style={{ color: "#34c759" }}>
              ✓ {t("about.upToDate")}
            </span>
          )}
          {status === "new_version" && (
            <button
              onClick={handleDownload}
              className="text-[11px] font-medium px-4 py-1.5 rounded-lg transition-colors"
              style={{
                color: "#fff",
                background: "var(--accent)",
              }}
            >
              {t("about.newVersion")}
            </button>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {t("about.checkError")}
              </span>
              <button
                onClick={handleCheckUpdate}
                className="text-[11px] font-medium"
                style={{ color: "var(--accent)" }}
              >
                {t("about.checkUpdate")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
