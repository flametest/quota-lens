use chrono::{DateTime, Local, Utc};
use reqwest::Client;
use serde::Deserialize;

use super::provider::{ModelUsage, Provider, QuotaLimit, ToolUsage};

pub struct GlmProvider {
    client: Client,
    base_url: String,
    auth_token: String,
}

#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    data: T,
}

#[derive(Debug, Deserialize)]
struct QuotaLimitItem {
    #[serde(rename = "type")]
    item_type: String,
    percentage: f64,
    #[serde(rename = "currentValue")]
    current_value: Option<f64>,
    usage: Option<f64>,
    #[serde(rename = "usageDetails")]
    usage_details: Option<serde_json::Value>,
}

impl GlmProvider {
    pub fn new(base_url: &str, auth_token: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            auth_token: auth_token.to_string(),
        }
    }

    fn format_datetime(dt: &DateTime<Utc>) -> String {
        dt.format("%Y-%m-%d %H:%M:%S").to_string()
    }
}

impl Provider for GlmProvider {
    fn name(&self) -> &str {
        "GLM"
    }

    async fn fetch_model_usage_raw(&self, start: &DateTime<Utc>, end: &DateTime<Utc>) -> Result<serde_json::Value, String> {
        let url = format!(
            "{}/api/monitor/usage/model-usage?startTime={}&endTime={}",
            self.base_url,
            urlencoding::encode(&Self::format_datetime(start)),
            urlencoding::encode(&Self::format_datetime(end)),
        );

        let resp = self.client
            .get(&url)
            .header("Authorization", &self.auth_token)
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("API error {}: {}", status, body));
        }

        let data: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        // Return raw data for frontend to parse
        Ok(data)
    }

    async fn fetch_tool_usage(&self, start: &DateTime<Utc>, end: &DateTime<Utc>) -> Result<ToolUsage, String> {
        let url = format!(
            "{}/api/monitor/usage/tool-usage?startTime={}&endTime={}",
            self.base_url,
            urlencoding::encode(&Self::format_datetime(start)),
            urlencoding::encode(&Self::format_datetime(end)),
        );

        let resp = self.client
            .get(&url)
            .header("Authorization", &self.auth_token)
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("API error {}: {}", status, body));
        }

        let data: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        let inner = data.get("data").unwrap_or(&data);

        Ok(ToolUsage {
            total_calls: inner.as_array()
                .map(|a| a.len() as u32)
                .unwrap_or(0),
            details: inner.clone(),
        })
    }

    async fn fetch_quota_limit(&self) -> Result<QuotaLimit, String> {
        let url = format!("{}/api/monitor/usage/quota/limit", self.base_url);

        let resp = self.client
            .get(&url)
            .header("Authorization", &self.auth_token)
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("API error {}: {}", status, body));
        }

        let data: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        let inner = data.get("data").unwrap_or(&data);
        let limits = inner.get("limits")
            .or_else(|| inner.as_array().and_then(|a| a.first()))
            .unwrap_or(inner);

        let mut quota = QuotaLimit {
            five_hour_percentage: 0.0,
            five_hour_reset_at: None,
            mcp_percentage: 0.0,
            mcp_monthly_used: 0,
            mcp_monthly_total: 0,
            mcp_monthly_reset_at: None,
            mcp_usage_details: None,
        };

        if let Some(items) = limits.as_array() {
            for item in items {
                let item_type = item.get("type").and_then(|v| v.as_str()).unwrap_or("");
                match item_type {
                    "TOKENS_LIMIT" => {
                        quota.five_hour_percentage = item.get("percentage")
                            .and_then(|v| v.as_f64())
                            .unwrap_or(0.0);
                        quota.five_hour_reset_at = item.get("nextResetTime")
                            .and_then(|v| v.as_i64())
                            .map(|ms| {
                                let secs = ms / 1000;
                                let dt = chrono::DateTime::from_timestamp(secs, 0)
                                    .unwrap_or_default()
                                    .with_timezone(&chrono::Local);
                                dt.format("%H:%M").to_string()
                            });
                    }
                    "TIME_LIMIT" => {
                        quota.mcp_percentage = item.get("percentage")
                            .and_then(|v| v.as_f64())
                            .unwrap_or(0.0);
                        quota.mcp_monthly_used = item.get("currentValue")
                            .or_else(|| item.get("currentUsage"))
                            .and_then(|v| v.as_f64())
                            .map(|v| v as u32)
                            .unwrap_or(0);
                        quota.mcp_monthly_total = item.get("usage")
                            .or_else(|| item.get("total"))
                            .and_then(|v| v.as_f64())
                            .map(|v| v as u32)
                            .unwrap_or(0);
                        quota.mcp_monthly_reset_at = item.get("nextResetTime")
                            .and_then(|v| v.as_i64())
                            .map(|ms| {
                                let secs = ms / 1000;
                                let dt = chrono::DateTime::from_timestamp(secs, 0)
                                    .unwrap_or_default()
                                    .with_timezone(&chrono::Local);
                                dt.format("%Y-%m-%d %H:%M").to_string()
                            });
                        quota.mcp_usage_details = item.get("usageDetails").cloned();
                    }
                    _ => {}
                }
            }
        }

        Ok(quota)
    }
}

impl GlmProvider {
    pub async fn send_hi(&self) -> Result<(), String> {
        let url = format!("{}/api/paas/v4/chat/completions", self.base_url);

        let body = serde_json::json!({
            "model": "glm-4-flash",
            "messages": [{"role": "user", "content": "hi"}],
            "max_tokens": 1,
        });

        let resp = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("Send hi failed {}: {}", status, text));
        }

        Ok(())
    }
}

