use chrono::{DateTime, Utc};
use reqwest::Client;

use super::provider::{ModelUsage, Provider, QuotaLimit, ToolUsage};

pub struct ClaudeProvider {
    client: Client,
    base_url: String,
    api_key: String,
}

impl ClaudeProvider {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
        }
    }
}

impl Provider for ClaudeProvider {
    fn name(&self) -> &str {
        "Claude"
    }

    async fn fetch_model_usage_raw(&self, _start: &DateTime<Utc>, _end: &DateTime<Utc>) -> Result<serde_json::Value, String> {
        Ok(serde_json::json!({"data": {"total_tokens": 0}}))
    }

    async fn fetch_tool_usage(&self, start: &DateTime<Utc>, end: &DateTime<Utc>) -> Result<ToolUsage, String> {
        Ok(ToolUsage {
            total_calls: 0,
            details: serde_json::Value::Null,
        })
    }

    async fn fetch_quota_limit(&self) -> Result<QuotaLimit, String> {
        Ok(QuotaLimit {
            five_hour_percentage: 0.0,
            five_hour_reset_at: None,
            mcp_monthly_used: 0,
            mcp_monthly_total: 0,
            mcp_percentage: 0.0,
            mcp_monthly_reset_at: None,
            mcp_usage_details: None,
        })
    }
}
