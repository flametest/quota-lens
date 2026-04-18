import { NotificationConfig } from "../../hooks/useConfig";
import { useI18n } from "../../hooks/useI18n";

interface Props {
  config: NotificationConfig;
  updateNotifications: (updates: Partial<NotificationConfig>) => void;
}

export default function NotificationConfigPanel({ config, updateNotifications }: Props) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        {t("notification.title")}
      </h3>

      {/* Warning threshold */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-primary)" }}>{t("notification.warnThreshold")}</span>
          <span className="text-xs font-bold" style={{ color: "var(--warning)" }}>
            {config.warnThreshold}%
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={99}
          value={config.warnThreshold}
          onChange={(e) => updateNotifications({ warnThreshold: parseInt(e.target.value) })}
          className="w-full accent-orange-500"
        />
        <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
          {t("notification.warnDesc")}
        </p>
      </div>

      {/* Critical threshold */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-primary)" }}>{t("notification.criticalThreshold")}</span>
          <span className="text-xs font-bold" style={{ color: "var(--danger)" }}>
            {config.criticalThreshold}%
          </span>
        </div>
        <input
          type="range"
          min={80}
          max={100}
          value={config.criticalThreshold}
          onChange={(e) => updateNotifications({ criticalThreshold: parseInt(e.target.value) })}
          className="w-full accent-red-500"
        />
        <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
          {t("notification.criticalDesc")}
        </p>
      </div>

      {/* Daily summary toggle */}
      <div className="card flex items-center justify-between">
        <div>
          <span className="text-xs font-medium block" style={{ color: "var(--text-primary)" }}>
            {t("notification.dailySummary")}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {t("notification.dailySummaryDesc")}
          </span>
        </div>
        <button
          onClick={() => updateNotifications({ dailySummary: !config.dailySummary })}
          className="w-10 h-6 rounded-full relative transition-colors"
          style={{
            background: config.dailySummary ? "var(--success)" : "var(--bg-tertiary)",
          }}
        >
          <div
            className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
            style={{
              left: config.dailySummary ? "20px" : "4px",
            }}
          />
        </button>
      </div>

      {/* Daily summary time */}
      {config.dailySummary && (
        <div className="card animate-slide-up">
          <span className="text-xs block mb-2" style={{ color: "var(--text-primary)" }}>
            {t("notification.summaryTime")}
          </span>
          <div className="flex items-center gap-1">
            <select
              value={parseInt(config.dailySummaryTime?.split(":")[0]) ?? 22}
              onChange={(e) => {
                const h = e.target.value.padStart(2, "0");
                const m = config.dailySummaryTime?.split(":")[1] || "00";
                updateNotifications({ dailySummaryTime: `${h}:${m}` });
              }}
              className="input text-xs"
              style={{ width: 56, padding: "4px 6px" }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>:</span>
            <select
              value={parseInt(config.dailySummaryTime?.split(":")[1]) ?? 0}
              onChange={(e) => {
                const m = e.target.value.padStart(2, "0");
                const h = config.dailySummaryTime?.split(":")[0] || "22";
                updateNotifications({ dailySummaryTime: `${h}:${m}` });
              }}
              className="input text-xs"
              style={{ width: 56, padding: "4px 6px" }}
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
