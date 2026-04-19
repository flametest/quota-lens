import { useEffect } from "react";
import { sendNotification, requestPermission } from "@tauri-apps/plugin-notification";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Popup from "./components/Popup";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import { I18nProvider, useI18n } from "./hooks/useI18n";

function AppContent() {
  const { resolved } = useTheme();
  const { t } = useI18n();

  const invoke = (cmd: string, args?: Record<string, unknown>) =>
    (window as any).__TAURI__.core.invoke(cmd, args);

  const getActiveProvider = () => {
    const stored = localStorage.getItem("quota-lens-config");
    if (!stored) return null;
    const config = JSON.parse(stored);
    return config?.providers?.find((p: any) => p.id === config.activeProviderId) || null;
  };

  // Request notification permission on startup
  useEffect(() => {
    requestPermission().catch(() => {});
  }, []);

  // Sync auto-hi config to Rust backend when it changes
  useEffect(() => {
    const syncConfig = () => {
      const stored = localStorage.getItem("quota-lens-config");
      if (!stored) return;
      try {
        const config = JSON.parse(stored);
        const { autoHiEnabled, autoHiTimes } = config.notifications || {};
        if (typeof autoHiEnabled === "boolean" && Array.isArray(autoHiTimes)) {
          invoke("update_auto_hi_config", {
            enabled: autoHiEnabled,
            times: autoHiTimes,
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    // Initial sync
    syncConfig();

    // Sync every minute to catch any configuration changes
    const interval = setInterval(syncConfig, 60 * 1000);
    return () => clearInterval(interval);
  }, [invoke]);

  // Listen for auto-hi trigger events from Rust backend
  useEffect(() => {
    console.log("[Auto-Hi] Setting up event listener");
    console.log("[Auto-Hi] getCurrentWindow:", typeof getCurrentWindow);

    getCurrentWindow().listen("trigger-auto-hi", async () => {
      console.log("[Auto-Hi] Event received!");
      const provider = getActiveProvider();
      console.log("[Auto-Hi] Provider:", provider);

      if (!provider?.auth_token) {
        console.log("[Auto-Hi] No auth token, skipping");
        return;
      }

      for (let i = 0; i < 3; i++) {
        try {
          console.log(`[Auto-Hi] Sending HI attempt ${i + 1}/3`);
          await invoke("send_hi_message", {
            baseUrl: provider.base_url,
            authToken: provider.auth_token,
          });
          console.log(`[Auto-Hi] Attempt ${i + 1} succeeded`);
        } catch (e) {
          console.log(`[Auto-Hi] Attempt ${i + 1} failed:`, e);
        }
        if (i < 2) {
          await new Promise((r) => setTimeout(r, 2 * 60 * 1000));
        }
      }
    }).then((unlisten: any) => {
      console.log("[Auto-Hi] Event listener registered:", typeof unlisten);
    });

    return () => {
      console.log("[Auto-Hi] Cleaning up event listener");
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
            const msg = await invoke("send_daily_summary", {
              baseUrl: provider.base_url,
              authToken: provider.auth_token,
            });
            sendNotification({
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
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
