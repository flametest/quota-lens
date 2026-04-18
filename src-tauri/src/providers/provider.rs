use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_tokens: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolUsage {
    pub total_calls: u32,
    pub details: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaLimit {
    pub five_hour_percentage: f64,
    pub five_hour_reset_at: Option<String>,
    pub mcp_percentage: f64,
    pub mcp_monthly_used: u32,
    pub mcp_monthly_total: u32,
    pub mcp_monthly_reset_at: Option<String>,
    pub mcp_usage_details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanInfo {
    pub name: String,
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageData {
    pub plan: PlanInfo,
    pub model_usage: ModelUsage,
    pub tool_usage: ToolUsage,
    pub quota: QuotaLimit,
}

pub trait Provider: Send + Sync {
    fn name(&self) -> &str;
    fn fetch_model_usage_raw(&self, start: &DateTime<Utc>, end: &DateTime<Utc>) -> impl std::future::Future<Output = Result<serde_json::Value, String>> + Send;
    fn fetch_tool_usage(&self, start: &DateTime<Utc>, end: &DateTime<Utc>) -> impl std::future::Future<Output = Result<ToolUsage, String>> + Send;
    fn fetch_quota_limit(&self) -> impl std::future::Future<Output = Result<QuotaLimit, String>> + Send;
}
