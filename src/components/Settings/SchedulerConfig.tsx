import { AppConfig } from "../../hooks/useConfig";

interface Props {
  config: AppConfig;
}

export default function SchedulerConfigPanel({ config }: Props) {
  const summaryTime = config.notifications.dailySummaryTime;
  const dailyEnabled = config.notifications.dailySummary;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        定时任务
      </h3>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-medium block" style={{ color: "var(--text-primary)" }}>
              每日汇总
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
              每天汇总当日用量并推送通知
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
            {dailyEnabled ? "已开启" : "已关闭"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>执行时间:</span>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            每天 {summaryTime}
          </span>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
          可在"通知"页面修改时间和开关
        </p>
      </div>

      <div className="card">
        <span className="text-xs font-medium block mb-1" style={{ color: "var(--text-primary)" }}>
          自动刷新间隔
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          当前：每 5 分钟自动刷新一次用量数据
        </span>
      </div>

      {/* Future features */}
      <div className="border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
        <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          计划中的功能
        </h4>
        <div className="flex flex-col gap-2 opacity-50">
          <div className="card">
            <span className="text-xs" style={{ color: "var(--text-primary)" }}>
              自动发送 "hi" 刷新 5h 额度
            </span>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              根据需求决定是否开启
            </p>
          </div>
          <div className="card">
            <span className="text-xs" style={{ color: "var(--text-primary)" }}>
              用量导出（CSV/JSON）
            </span>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              导出历史用量数据
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
