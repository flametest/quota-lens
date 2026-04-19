use chrono::{DateTime, Local};
use reqwest::Client;

use super::provider::{Provider, QuotaLimit, ToolUsage};

pub struct OpenAiProvider {
    client: Client,
    base_url: String,
    api_key: String,
}

impl OpenAiProvider {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
        }
    }
}

impl Provider for OpenAiProvider {
    fn name(&self) -> &str {
        "OpenAI"
    }

    async fn fetch_model_usage_raw(&self, start: &DateTime<Local>, end: &DateTime<Local>) -> Result<serde_json::Value, String> {
        let start_date = start.format("%Y-%m-%d");
        let end_date = end.format("%Y-%m-%d");
        let url = format!(
            "{}/v1/usage?start_date={}&end_date={}",
            self.base_url, start_date, end_date
        );

        let resp = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("OpenAI API error {}: {}", status, body));
        }

        let data: serde_json::Value = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
        Ok(data)
    }

    async fn fetch_tool_usage(&self, _start: &DateTime<Local>, _end: &DateTime<Local>) -> Result<ToolUsage, String> {
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
