import { NotificationConfig } from "../../hooks/useConfig";

interface Props {
  config: NotificationConfig;
  updateNotifications: (updates: Partial<NotificationConfig>) => void;
}

export default function NotificationConfigPanel({ config, updateNotifications }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        通知设置
      </h3>

      {/* Warning threshold */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-primary)" }}>预警阈值</span>
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
          用量达到此比例时弹出预警通知
        </p>
      </div>

      {/* Critical threshold */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-primary)" }}>紧急阈值</span>
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
          用量达到此比例时弹出紧急通知
        </p>
      </div>

      {/* Daily summary toggle */}
      <div className="card flex items-center justify-between">
        <div>
          <span className="text-xs font-medium block" style={{ color: "var(--text-primary)" }}>
            每日汇总通知
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            每天定时推送用量汇总
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
            汇总推送时间
          </span>
          <input
            type="time"
            value={config.dailySummaryTime}
            onChange={(e) => updateNotifications({ dailySummaryTime: e.target.value })}
            className="input text-xs"
          />
        </div>
      )}
    </div>
  );
}
