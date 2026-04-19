export const en: Record<string, string> = {
  // App.tsx
  "app.dailySummaryTitle": "Quota Lens - Daily Summary",

  // Popup.tsx
  "popup.errorNoToken": "Please configure a Provider Token in Settings first.",
  "popup.tokenCritical": "Token usage has reached {pct}%! Please conserve usage.",
  "popup.tokenWarning": "Token usage has reached {pct}%. Please monitor your usage.",
  "popup.openSettings": "Open Settings",
  "popup.retry": "Retry",
  "popup.quota5h": "5-Hour Usage Quota",
  "popup.resetTime": "Reset Time",
  "popup.mcpMonthly": "MCP Monthly Quota",
  "popup.tokenUsage": "Token Usage",

  // TokenStats.tsx
  "stats.today": "Today",
  "stats.week7": "Last 7 Days",
  "stats.month30": "Last 30 Days",

  // TokenUsageChart.tsx
  "chart.noData": "No chart data available for the last 7 days",
  "chart.subtitle": "Hourly token usage over the last 7 days",
  "chart.peak": "Peak {value}",

  // Settings/SettingsPage.tsx
  "settings.back": "← Back",
  "settings.title": "Settings",
  "settings.tabProvider": "Provider",
  "settings.tabTheme": "Appearance",
  "settings.tabNotification": "Alerts",
  "settings.tabScheduler": "Schedule",

  // Settings/ThemeConfig.tsx
  "theme.title": "Appearance",
  "theme.language": "Language",
  "theme.system.label": "System",
  "theme.system.desc": "Match macOS appearance settings",
  "theme.light.label": "Light",
  "theme.light.desc": "Bright style",
  "theme.dark.label": "Dark",
  "theme.dark.desc": "Dark style",

  // Provider names (by type)
  "provider.name.glm": "Zhipu GLM",
  "provider.name.claude": "Claude",
  "provider.name.openai": "OpenAI",
  "provider.name.grok": "Grok",

  // Settings/ProviderConfig.tsx
  "provider.title": "Provider Settings",
  "provider.desc": "Configure API connection info. The active Provider is used to fetch usage data.",
  "provider.configured": "Configured",
  "provider.notConfigured": "Not Configured",
  "provider.tokenPlaceholder": "Enter API Token",
  "provider.save": "Save",
  "provider.cancel": "Cancel",
  "provider.editConfig": "Edit Config",
  "provider.setupToken": "Configure Token",
  "provider.moreTitle": "More Providers (Coming Soon)",
  "provider.comingSoon": "Coming Soon",

  // Settings/NotificationConfig.tsx
  "notification.title": "Notification Settings",
  "notification.warnThreshold": "Warning Threshold",
  "notification.warnDesc": "Show a warning notification when usage reaches this percentage",
  "notification.criticalThreshold": "Critical Threshold",
  "notification.criticalDesc": "Show a critical notification when usage reaches this percentage",
  "notification.dailySummary": "Daily Summary",
  "notification.dailySummaryDesc": "Push a daily usage summary at a scheduled time",
  "notification.summaryTime": "Summary Push Time",

  // Settings/SchedulerConfig.tsx
  "scheduler.title": "Scheduled Tasks",
  "scheduler.autoRefresh": "Auto-Refresh Quota",
  "scheduler.autoRefreshDesc": "Send messages on a schedule to refresh the 5h Token quota",
  "scheduler.autoRefreshDetail": "Automatically sends 3 times per time slot (2 min intervals)",
  "scheduler.addHour": "Add",
  "scheduler.dailySummary": "Daily Summary",
  "scheduler.dailySummaryDesc": "Summarize daily usage and push a notification",
  "scheduler.enabled": "Enabled",
  "scheduler.disabled": "Disabled",
  "scheduler.execTime": "Run time:",
  "scheduler.everyday": "Every day {time}",
  "scheduler.notifPageHint": "Time and toggle can be changed in the Notifications tab",
  "scheduler.refreshInterval": "Auto-Refresh Interval",
  "scheduler.minutes": "min",
  "scheduler.trayPercent": "Show Tray Percentage",
  "scheduler.trayPercentDesc": "Display 5h quota percentage next to menu bar icon",

  // Settings/AboutPanel.tsx
  "settings.tabAbout": "About",
  "about.version": "Version",
  "about.author": "Author",
  "about.desc": "AI Token quota monitor for your macOS menu bar",
};
