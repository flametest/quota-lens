import { useEffect } from "react";
import Popup from "./components/Popup";
import { useTheme } from "./hooks/useTheme";

function App() {
  const { resolved } = useTheme();

  // Listen for daily summary events from Rust backend
  useEffect(() => {
    const unlisten = (window as any).__TAURI__?.event?.listen?.(
      "check-daily-summary",
      async () => {
        const stored = localStorage.getItem("quota-lens-config");
        if (!stored) return;
        const config = JSON.parse(stored);
        const activeProvider = config?.providers?.find(
          (p: any) => p.id === config.activeProviderId
        );
        if (!activeProvider?.auth_token || !config?.notifications?.dailySummary) return;

        const now = new Date();
        const [h, m] = (config.notifications.dailySummaryTime || "22:00").split(":").map(Number);
        if (now.getHours() === h && now.getMinutes() === m) {
          try {
            const msg = await (window as any).__TAURI__.core.invoke("send_daily_summary", {
              baseUrl: activeProvider.base_url,
              authToken: activeProvider.auth_token,
            });
            (window as any).__TAURI__?.notification?.sendNotification?.({
              title: "Quota Lens - 每日汇总",
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
  }, []);

  return (
    <div className={resolved === "dark" ? "dark" : ""}>
      <Popup />
    </div>
  );
}

export default App;
