export const zh: Record<string, string> = {
  // App.tsx
  "app.dailySummaryTitle": "Quota Lens - 每日汇总",

  // Popup.tsx
  "popup.errorNoToken": "请先在设置中配置 Provider Token。",
  "popup.tokenCritical": "Token 额度已达 {pct}%！请节省使用。",
  "popup.tokenWarning": "Token 额度已达 {pct}%，请注意用量。",
  "popup.openSettings": "打开设置",
  "popup.retry": "重试",
  "popup.quota5h": "每5小时使用额度",
  "popup.resetTime": "重置时间",
  "popup.mcpMonthly": "MCP 月度额度",
  "popup.tokenUsage": "Token 消耗",

  // TokenStats.tsx
  "stats.today": "今日",
  "stats.week7": "近7天",
  "stats.month30": "近30天",

  // TokenUsageChart.tsx
  "chart.noData": "近 7 天暂无可用曲线数据",
  "chart.subtitle": "近 7 天每小时 token 消耗",
  "chart.peak": "峰值 {value}",

  // Settings/SettingsPage.tsx
  "settings.back": "← 返回",
  "settings.title": "设置",
  "settings.tabProvider": "Provider",
  "settings.tabTheme": "外观",
  "settings.tabNotification": "通知",
  "settings.tabScheduler": "定时",

  // Settings/ThemeConfig.tsx
  "theme.title": "外观",
  "theme.language": "语言",
  "theme.system.label": "跟随系统",
  "theme.system.desc": "自动匹配 macOS 外观设置",
  "theme.light.label": "浅色",
  "theme.light.desc": "明亮风格",
  "theme.dark.label": "深色",
  "theme.dark.desc": "暗黑风格",

  // Provider names (by type)
  "provider.name.glm": "GLM(智谱)",
  "provider.name.claude": "Claude",
  "provider.name.openai": "OpenAI",
  "provider.name.grok": "Grok",

  // Settings/ProviderConfig.tsx
  "provider.title": "Provider 配置",
  "provider.desc": "配置大模型 API 连接信息。当前激活的 Provider 用于拉取用量数据。",
  "provider.configured": "已配置",
  "provider.notConfigured": "未配置",
  "provider.tokenPlaceholder": "输入 API Token",
  "provider.save": "保存",
  "provider.cancel": "取消",
  "provider.editConfig": "修改配置",
  "provider.setupToken": "配置 Token",
  "provider.moreTitle": "更多 Provider（后续支持）",
  "provider.comingSoon": "即将支持",

  // Settings/NotificationConfig.tsx
  "notification.title": "通知设置",
  "notification.warnThreshold": "预警阈值",
  "notification.warnDesc": "用量达到此比例时弹出预警通知",
  "notification.criticalThreshold": "紧急阈值",
  "notification.criticalDesc": "用量达到此比例时弹出紧急通知",
  "notification.dailySummary": "每日汇总通知",
  "notification.dailySummaryDesc": "每天定时推送用量汇总",
  "notification.summaryTime": "汇总推送时间",

  // Settings/SchedulerConfig.tsx
  "scheduler.title": "定时任务",
  "scheduler.autoRefresh": "自动刷新额度",
  "scheduler.autoRefreshDesc": "定时发送消息刷新 5h Token 额度",
  "scheduler.autoRefreshDetail": "每个时间点自动发送 3 次（间隔 2 分钟）",
  "scheduler.addHour": "添加",
  "scheduler.dailySummary": "每日汇总",
  "scheduler.dailySummaryDesc": "每天汇总当日用量并推送通知",
  "scheduler.enabled": "已开启",
  "scheduler.disabled": "已关闭",
  "scheduler.execTime": "执行时间:",
  "scheduler.everyday": "每天 {time}",
  "scheduler.notifPageHint": "可在\"通知\"页面修改时间和开关",
  "scheduler.refreshInterval": "自动刷新间隔",
  "scheduler.minutes": "分钟",
  "scheduler.trayPercent": "显示托盘百分比",
  "scheduler.trayPercentDesc": "在菜单栏图标旁显示 5h 额度百分比",

  // Settings/AboutPanel.tsx
  "settings.tabAbout": "关于",
  "about.version": "版本",
  "about.github": "GitHub",
  "about.author": "作者",
  "about.desc": "macOS 菜单栏 AI Token 额度监控器",
  "about.checkUpdate": "检查更新",
  "about.checking": "检查中...",
  "about.upToDate": "已是最新版本",
  "about.newVersion": "发现新版本，点击下载",
  "about.checkError": "检查失败",
};
