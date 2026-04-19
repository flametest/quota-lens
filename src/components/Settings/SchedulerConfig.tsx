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
  const autoHiTimes: string[] = config.notifications.autoHiTimes;

  const [newTime, setNewTime] = useState("");

  const addTime = () => {
    const match = newTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return;
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (autoHiTimes.includes(timeStr)) return;
    const updated = [...autoHiTimes, timeStr].sort();
    updateNotifications({ autoHiTimes: updated });
    setNewTime("");
  };

  const removeTime = (t: string) => {
    updateNotifications({ autoHiTimes: autoHiTimes.filter((x) => x !== t) });
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

            {/* Time tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {autoHiTimes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{ background: "var(--accent)", color: "white", opacity: 0.85 }}
                >
                  {t}
                  <button
                    onClick={() => removeTime(t)}
                    className="hover:opacity-70 leading-none"
                    style={{ fontSize: 10 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add time */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="HH:MM"
                className="input text-xs"
                style={{ width: 72, padding: "4px 8px" }}
                onKeyDown={(e) => e.key === "Enter" && addTime()}
              />
              <button
                onClick={addTime}
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
        <span className="text-xs font-medium block mb-2" style={{ color: "var(--text-primary)" }}>
          {t("scheduler.refreshInterval")}
        </span>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const v = Math.max(1, config.notifications.refreshInterval - 1);
              updateNotifications({ refreshInterval: v });
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            −
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            {config.notifications.refreshInterval} {t("scheduler.minutes")}
          </span>
          <button
            onClick={() => {
              const v = Math.min(60, config.notifications.refreshInterval + 1);
              updateNotifications({ refreshInterval: v });
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
