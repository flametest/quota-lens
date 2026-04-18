import { useState, useEffect, useCallback } from "react";
import ProgressBar from "./ProgressBar";
import TokenStats from "./TokenStats";
import TokenUsageChart from "./TokenUsageChart";
import SettingsPage from "./Settings/SettingsPage";
import { useTheme } from "../hooks/useTheme";
import { useConfig } from "../hooks/useConfig";

interface UsageData {
  week_series: { label: string; value: number }[];
  today: { total_tokens: number };
  week: { total_tokens: number };
  month: { total_tokens: number };
  quota: {
    five_hour_percentage: number;
    five_hour_reset_at?: string;
    mcp_percentage?: number;
    mcp_monthly_used: number;
    mcp_monthly_total: number;
    mcp_monthly_reset_at?: string;
  };
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "K";
  return n.toString();
}

function extractSeries(raw: any): { label: string; value: number }[] {
  if (!raw) return [];
  const data = raw.data ?? raw;
  const values = Array.isArray(data.tokensUsage) ? data.tokensUsage : [];
  const labels = Array.isArray(data.x_time) ? data.x_time : [];

  return values.map((value: number, index: number) => ({
    label: labels[index] || `${index}`,
    value: typeof value === "number" ? value : 0,
  }));
}

export default function Popup() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { setTheme, theme } = useTheme();
  const { activeProvider, config, updateNotifications, updateProvider } = useConfig();

  const loadUsage = useCallback(async () => {
    const provider = config.providers.find((p) => p.id === config.activeProviderId);
    if (!provider?.auth_token) {
      setData(null);
      setError("请先在设置中配置 Provider Token。");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await (window as any).__TAURI__.core.invoke("fetch_all_usage", {
        baseUrl: provider.base_url,
        authToken: provider.auth_token,
      });

      // Debug: log raw API response
      console.log("[Quota Lens] raw response:", JSON.stringify(result, null, 2));

      // Extract total_tokens from raw API response
      const extractTotal = (raw: any): number => {
        if (!raw) return 0;
        const d = raw.data ?? raw;
        // GLM structure: data.totalUsage.totalTokensUsage
        if (d.totalUsage?.totalTokensUsage) return d.totalUsage.totalTokensUsage;
        // Fallback: sum modelSummaryList
        if (Array.isArray(d.modelSummaryList)) {
          return d.modelSummaryList.reduce((sum: number, m: any) => sum + (m.totalTokens || 0), 0);
        }
        // Fallback: direct field
        for (const key of ["totalTokens", "total_tokens", "tokens"]) {
          if (typeof d[key] === "number") return d[key];
        }
        return 0;
      };

      const parsed: UsageData = {
        week_series: extractSeries(result.week_raw),
        today: { total_tokens: extractTotal(result.today_raw) },
        week: { total_tokens: extractTotal(result.week_raw) },
        month: { total_tokens: extractTotal(result.month_raw) },
        quota: result.quota,
      };
      setData(parsed);

      // Debug: log quota to verify reset times
      console.log("[Quota Lens] quota:", JSON.stringify(result.quota, null, 2));

      // Check thresholds
      if (result.quota) {
        const pct = result.quota.five_hour_percentage;
        const crit = config.notifications.criticalThreshold;
        const warn = config.notifications.warnThreshold;
        if (pct >= crit) {
          await (window as any).__TAURI__.notification?.sendNotification?.({
            title: "Quota Lens",
            body: `Token 额度已达 ${pct.toFixed(0)}%！请节省使用。`,
          });
        } else if (pct >= warn) {
          await (window as any).__TAURI__.notification?.sendNotification?.({
            title: "Quota Lens",
            body: `Token 额度已达 ${pct.toFixed(0)}%，请注意用量。`,
          });
        }
      }
    } catch (e: any) {
      setError(e?.toString() || "Failed to fetch usage");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadUsage();
    const timer = setInterval(loadUsage, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadUsage]);

  if (showSettings) {
    return (
      <SettingsPage
        onClose={() => {
          setShowSettings(false);
          // Small delay to let React state settle before loading
          setTimeout(() => loadUsage(), 100);
        }}
        theme={theme}
        setTheme={setTheme}
        config={config}
        updateNotifications={updateNotifications}
        updateProvider={updateProvider}
      />
    );
  }

  const quotaPct = data?.quota?.five_hour_percentage ?? 0;
  const mcpPct = data?.quota?.mcp_percentage
    || (data?.quota && data.quota.mcp_monthly_total > 0
      ? (data.quota.mcp_monthly_used / data.quota.mcp_monthly_total) * 100
      : 0);

  const getFiveHourReset = (): string => data?.quota?.five_hour_reset_at ?? "--:--";
  const getMcpReset = (): string | null => data?.quota?.mcp_monthly_reset_at ?? null;

  return (
    <div className="w-[320px] p-4 flex flex-col gap-4 animate-fade-in glass rounded-2xl border" style={{ borderColor: "var(--border-color)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {activeProvider?.name || "Quota Lens"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadUsage}
            disabled={loading}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "var(--bg-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36A.25.25 0 0 1 11.534 7zM.534 9h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
              <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
          </button>
          <button
            onClick={() => (window as any).__TAURI__.core.invoke("quit_app")}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.5 1v7.5h1V1h-1z"/>
              <path d="M3.5 3.5a6 6 0 1 0 9 0 .5.5 0 0 0-.75.66A5 5 0 1 1 4.25 4.16.5.5 0 0 0 3.5 3.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "var(--progress-bg)", borderTopColor: "var(--accent)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Loading...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--danger)", opacity: 0.15 }}>
            <span style={{ color: "var(--danger)", fontSize: 18 }}>!</span>
          </div>
          <p className="text-xs text-center max-w-[200px]" style={{ color: "var(--danger)" }}>{error}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="btn-primary text-xs">打开设置</button>
            <button onClick={loadUsage} className="btn-secondary text-xs">重试</button>
          </div>
        </div>
      )}

      {/* Data display */}
      {data && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Token quota (5h) */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                每5小时使用额度
              </span>
              <span className="text-xs font-bold" style={{
                color: quotaPct >= 90 ? "var(--danger)" : quotaPct >= 70 ? "var(--warning)" : "var(--text-primary)"
              }}>
                {quotaPct.toFixed(0)}%
              </span>
            </div>
            <ProgressBar percentage={quotaPct} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                重置时间
              </span>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
                {getFiveHourReset()}
              </span>
            </div>
          </div>

          {/* MCP monthly */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                MCP 月度额度
              </span>
              <span className="text-xs font-bold" style={{
                color: mcpPct >= 90 ? "var(--danger)" : mcpPct >= 70 ? "var(--warning)" : "var(--text-primary)"
              }}>
                {mcpPct.toFixed(0)}%
              </span>
            </div>
            <ProgressBar percentage={mcpPct} />
            {getMcpReset() && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  重置时间
                </span>
                <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  {getMcpReset()}
                </span>
              </div>
            )}
          </div>

          {/* Token stats */}
          <div className="card">
            <span className="text-xs font-medium block mb-3" style={{ color: "var(--text-secondary)" }}>
              Token 消耗
            </span>
            <TokenStats
              today={formatTokens(data.today.total_tokens)}
              week={formatTokens(data.week.total_tokens)}
              month={formatTokens(data.month.total_tokens)}
            />
            <div className="mt-3">
              <TokenUsageChart points={data.week_series} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
