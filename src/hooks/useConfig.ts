import { useState, useEffect, useCallback } from "react";

export interface ProviderConfig {
  id: string;
  name: string;
  type: "glm" | "claude" | "openai" | "grok";
  base_url: string;
  auth_token: string;
  enabled: boolean;
}

export interface NotificationConfig {
  warnThreshold: number;
  criticalThreshold: number;
  dailySummary: boolean;
  dailySummaryTime: string;
  autoHiEnabled: boolean;
  autoHiTimes: string[];
  refreshInterval: number;
  showTrayPercent: boolean;
}

export interface AppConfig {
  providers: ProviderConfig[];
  activeProviderId: string;
  notifications: NotificationConfig;
}

const STORAGE_KEY = "quota-lens-config";

const defaultConfig: AppConfig = {
  providers: [
    {
      id: "glm-default",
      name: "智谱 GLM",
      type: "glm",
      base_url: "https://open.bigmodel.cn",
      auth_token: "",
      enabled: true,
    },
  ],
  activeProviderId: "glm-default",
  notifications: {
    warnThreshold: 80,
    criticalThreshold: 100,
    dailySummary: true,
    dailySummaryTime: "22:00",
    autoHiEnabled: true,
    autoHiTimes: ["07:00", "12:00", "17:00", "22:00"],
    refreshInterval: 5,
    showTrayPercent: true,
  },
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate autoHiHours (number[]) → autoHiTimes (string[])
        if (parsed.notifications?.autoHiHours && !parsed.notifications.autoHiTimes) {
          parsed.notifications.autoHiTimes = parsed.notifications.autoHiHours.map(
            (h: number) => `${String(h).padStart(2, "0")}:00`
          );
          delete parsed.notifications.autoHiHours;
        }
        return {
          ...defaultConfig,
          ...parsed,
          notifications: {
            ...defaultConfig.notifications,
            ...parsed.notifications,
          },
        };
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const updateProvider = useCallback((id: string, updates: Partial<ProviderConfig>) => {
    setConfig((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const updateNotifications = useCallback((updates: Partial<NotificationConfig>) => {
    setConfig((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates },
    }));
  }, []);

  const addProvider = useCallback((provider: ProviderConfig) => {
    setConfig((prev) => ({
      ...prev,
      providers: [...prev.providers, provider],
    }));
  }, []);

  const removeProvider = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      providers: prev.providers.filter((p) => p.id !== id),
      activeProviderId:
        prev.activeProviderId === id
          ? prev.providers[0]?.id || ""
          : prev.activeProviderId,
    }));
  }, []);

  const activeProvider = config.providers.find(
    (p) => p.id === config.activeProviderId
  );

  return {
    config,
    activeProvider,
    updateProvider,
    updateNotifications,
    addProvider,
    removeProvider,
    setActiveProvider: (id: string) =>
      setConfig((prev) => ({ ...prev, activeProviderId: id })),
  };
}
