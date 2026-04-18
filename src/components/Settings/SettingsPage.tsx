import { useState } from "react";
import { Theme } from "../../hooks/useTheme";
import { AppConfig, NotificationConfig, ProviderConfig } from "../../hooks/useConfig";
import ProviderConfigPanel from "./ProviderConfig";
import NotificationConfigPanel from "./NotificationConfig";
import ThemeConfigPanel from "./ThemeConfig";
import SchedulerConfigPanel from "./SchedulerConfig";

type Tab = "provider" | "theme" | "notification" | "scheduler";

interface Props {
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  config: AppConfig;
  updateNotifications: (updates: Partial<NotificationConfig>) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "provider", label: "Provider" },
  { id: "theme", label: "外观" },
  { id: "notification", label: "通知" },
  { id: "scheduler", label: "定时" },
];

export default function SettingsPage({ onClose, theme, setTheme, config, updateNotifications, updateProvider }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("provider");

  return (
    <div
      className="w-[320px] h-[480px] flex flex-col animate-fade-in glass rounded-2xl border"
      style={{ borderColor: "var(--border-color)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button type="button" onClick={onClose} className="text-xs font-medium cursor-pointer" style={{ color: "var(--accent)" }}>
          ← 返回
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          设置
        </span>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1" style={{ borderBottom: "1px solid var(--border-color)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-2 text-xs font-medium transition-colors relative cursor-pointer"
            style={{
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 animate-fade-in">
        {activeTab === "provider" && (
          <ProviderConfigPanel config={config} updateProvider={updateProvider} />
        )}
        {activeTab === "theme" && <ThemeConfigPanel theme={theme} setTheme={setTheme} />}
        {activeTab === "notification" && (
          <NotificationConfigPanel
            config={config.notifications}
            updateNotifications={updateNotifications}
          />
        )}
        {activeTab === "scheduler" && <SchedulerConfigPanel config={config} />}
      </div>
    </div>
  );
}
