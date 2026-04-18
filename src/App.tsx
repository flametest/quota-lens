import { useEffect } from "react";
import Popup from "./components/Popup";
import { useTheme } from "./hooks/useTheme";
import { I18nProvider, useI18n } from "./hooks/useI18n";

function AppContent() {
  const { resolved } = useTheme();
  const { t } = useI18n();

  const getActiveProvider = () => {
    const stored = localStorage.getItem("quota-lens-config");
    if (!stored) return null;
    const config = JSON.parse(stored);
    return config?.providers?.find((p: any) => p.id === config.activeProviderId) || null;
  };

  // Sync auto-hi config to Rust backend when it changes
  useEffect(() => {
    const stored = localStorage.getItem("quota-lens-config");
    if (!stored) return;
    try {
      const config = JSON.parse(stored);
      const { autoHiEnabled, autoHiHours } = config.notifications || {};
      if (typeof autoHiEnabled === "boolean" && Array.isArray(autoHiHours)) {
        (window as any).__TAURI__?.core?.invoke?.("update_auto_hi_config", {
          enabled: autoHiEnabled,
          hours: autoHiHours,
        });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Listen for auto-hi trigger events from Rust backend
  useEffect(() => {
    const unlisten = (window as any).__TAURI__?.event?.listen?.(
      "trigger-auto-hi",
      async () => {
        const provider = getActiveProvider();
        if (!provider?.auth_token) return;

        const invoke = (window as any).__TAURI__.core.invoke;
        for (let i = 0; i < 3; i++) {
          try {
            await invoke("send_hi_message", {
              baseUrl: provider.base_url,
              authToken: provider.auth_token,
            });
          } catch {
            // retry on next iteration
          }
          if (i < 2) {
            await new Promise((r) => setTimeout(r, 2 * 60 * 1000));
          }
        }
      }
    );

    return () => {
      unlisten?.then?.((fn: () => void) => fn());
    };
  }, []);

  // Listen for daily summary events from Rust backend
  useEffect(() => {
    const unlisten = (window as any).__TAURI__?.event?.listen?.(
      "check-daily-summary",
      async () => {
        const provider = getActiveProvider();
        if (!provider?.auth_token) return;
        const stored = localStorage.getItem("quota-lens-config");
        if (!stored) return;
        const config = JSON.parse(stored);
        if (!config?.notifications?.dailySummary) return;

        const now = new Date();
        const [h, m] = (config.notifications.dailySummaryTime || "22:00").split(":").map(Number);
        if (now.getHours() === h && now.getMinutes() === m) {
          try {
            const msg = await (window as any).__TAURI__.core.invoke("send_daily_summary", {
              baseUrl: provider.base_url,
              authToken: provider.auth_token,
            });
            (window as any).__TAURI__?.notification?.sendNotification?.({
              title: t("app.dailySummaryTitle"),
              body: msg,
            });
          } catch {
            // silently ignore
          }
        }
      }
    );

    return () => {
      unlisten?.then?.((fn: () => void) => fn());
    };
  }, [t]);

  return (
    <div className={resolved === "dark" ? "dark" : ""}>
      <Popup />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
