import { useState } from "react";
import { AppConfig } from "../../hooks/useConfig";
import { useI18n } from "../../hooks/useI18n";

interface Props {
  config: AppConfig;
  updateNotifications: (updates: Record<string, any>) => void;
}

export default function SchedulerConfigPanel({ config, updateNotifications }: Props) {
  const { t } = useI18n();
  const summaryTime = config.notifications.dailySummaryTime;
  const dailyEnabled = config.notifications.dailySummary;
  const autoHiEnabled = config.notifications.autoHiEnabled;
  const autoHiHours: number[] = config.notifications.autoHiHours;

  const [newHour, setNewHour] = useState("");

  const addHour = () => {
    const h = parseInt(newHour);
    if (isNaN(h) || h < 0 || h > 23 || autoHiHours.includes(h)) return;
    const updated = [...autoHiHours, h].sort((a, b) => a - b);
    updateNotifications({ autoHiHours: updated });
    setNewHour("");
  };

  const removeHour = (h: number) => {
    updateNotifications({ autoHiHours: autoHiHours.filter((x) => x !== h) });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        {t("scheduler.title")}
      </h3>

      {/* Auto-hi */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-medium block" style={{ color: "var(--text-primary)" }}>
              {t("scheduler.autoRefresh")}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {t("scheduler.autoRefreshDesc")}
            </span>
          </div>
          <button
            onClick={() => updateNotifications({ autoHiEnabled: !autoHiEnabled })}
            className="w-10 h-6 rounded-full relative transition-colors shrink-0"
            style={{ background: autoHiEnabled ? "var(--success)" : "var(--bg-tertiary)" }}
          >
            <div
              className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
              style={{ left: autoHiEnabled ? "20px" : "4px" }}
            />
          </button>
        </div>

        {autoHiEnabled && (
          <div className="animate-slide-up">
            <span className="text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>
              {t("scheduler.autoRefreshDetail")}
            </span>

            {/* Hour tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {autoHiHours.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{ background: "var(--accent)", color: "white", opacity: 0.85 }}
                >
                  {h}:00
                  <button
                    onClick={() => removeHour(h)}
                    className="hover:opacity-70 leading-none"
                    style={{ fontSize: 10 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add hour */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={23}
                value={newHour}
                onChange={(e) => setNewHour(e.target.value)}
                placeholder="0-23"
                className="input text-xs"
                style={{ width: 64, padding: "4px 8px" }}
                onKeyDown={(e) => e.key === "Enter" && addHour()}
              />
              <button
                onClick={addHour}
                className="text-[10px] px-2 py-1 rounded-md font-medium"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {t("scheduler.addHour")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Daily summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-medium block" style={{ color: "var(--text-primary)" }}>
              {t("scheduler.dailySummary")}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              {t("scheduler.dailySummaryDesc")}
            </span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded"
            style={{
              background: dailyEnabled ? "var(--success)" : "var(--bg-tertiary)",
              color: dailyEnabled ? "white" : "var(--text-secondary)",
              opacity: dailyEnabled ? 0.8 : 1,
            }}
          >
            {dailyEnabled ? t("scheduler.enabled") : t("scheduler.disabled")}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{t("scheduler.execTime")}</span>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {t("scheduler.everyday", { time: summaryTime })}
          </span>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
          {t("scheduler.notifPageHint")}
        </p>
      </div>

      {/* Auto-refresh interval */}
      <div className="card">
        <span className="text-xs font-medium block mb-1" style={{ color: "var(--text-primary)" }}>
          {t("scheduler.refreshInterval")}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {t("scheduler.refreshIntervalDesc")}
        </span>
      </div>
    </div>
  );
}
