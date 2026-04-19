use chrono::{DateTime, Local};
use reqwest::Client;
use serde::Deserialize;

use super::provider::{Provider, QuotaLimit, ToolUsage};

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

    fn format_datetime(dt: &DateTime<Local>) -> String {
        dt.format("%Y-%m-%d %H:%M:%S").to_string()
    }
}

impl Provider for GlmProvider {
    fn name(&self) -> &str {
        "GLM"
    }

    async fn fetch_model_usage_raw(&self, start: &DateTime<Local>, end: &DateTime<Local>) -> Result<serde_json::Value, String> {
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

    async fn fetch_tool_usage(&self, start: &DateTime<Local>, end: &DateTime<Local>) -> Result<ToolUsage, String> {
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
        println!("[Send-Hi] base_url: {}", self.base_url);
        let url = format!("{}/api/anthropic/chat/completions", self.base_url);
        println!("[Send-Hi] url: {}", url);

        let body = serde_json::json!({
            "model": "glm-5.1",
            "messages": [{"role": "user", "content": "hi"}],
            "max_tokens": 1,
        });

        let resp = self.client
            .post(&url)
            .header("Authorization", &self.auth_token)
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

// Tests based on real API response format from production
#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;
    use serde_json::json;

    async fn create_mock_server() -> mockito::ServerGuard {
        Server::new_async().await
    }

    // Based on real today_raw/week_raw API response (hourly granularity)
    #[tokio::test]
    async fn test_fetch_model_usage_raw_hourly() {
        let mut server = create_mock_server().await;

        let mock_response = json!({
            "code": 200,
            "data": {
                "granularity": "hourly",
                "modelCallCount": [159, 127, 88, 0, 0, 0],
                "modelDataList": [
                    {
                        "modelName": "GLM-5.1",
                        "sortOrder": 1,
                        "tokensUsage": [13327683, 17882513, 6856220, 0, 0, 0],
                        "totalTokens": 38066416
                    },
                    {
                        "modelName": "GLM-4.7",
                        "sortOrder": 2,
                        "tokensUsage": [0, 0, 0, 0, 0, 0],
                        "totalTokens": 4615002
                    },
                    {
                        "modelName": "GLM-4.6V",
                        "sortOrder": 3,
                        "tokensUsage": [0, 0, 0, 0, 0, 0],
                        "totalTokens": 18391
                    }
                ],
                "modelSummaryList": [
                    { "modelName": "GLM-5.1", "sortOrder": 1, "totalTokens": 38066416 },
                    { "modelName": "GLM-4.7", "sortOrder": 2, "totalTokens": 4615002 },
                    { "modelName": "GLM-4.6V", "sortOrder": 3, "totalTokens": 18391 }
                ],
                "tokensUsage": [13327683, 17882513, 6856220, 0, 0, 0],
                "totalUsage": {
                    "modelSummaryList": [
                        { "modelName": "GLM-5.1", "sortOrder": 1, "totalTokens": 38066416 },
                        { "modelName": "GLM-4.7", "sortOrder": 2, "totalTokens": 4615002 },
                        { "modelName": "GLM-4.6V", "sortOrder": 3, "totalTokens": 18391 }
                    ],
                    "totalModelCallCount": 374,
                    "totalTokensUsage": 42699809
                },
                "x_time": [
                    "2026-04-19 08:00", "2026-04-19 09:00", "2026-04-19 10:00",
                    "2026-04-19 11:00", "2026-04-19 12:00", "2026-04-19 13:00"
                ]
            },
            "msg": "操作成功",
            "success": true
        });

        let _mock = server
            .mock("GET", mockito::Matcher::Regex(r"/api/monitor/usage/model-usage\?.*".to_string()))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(mock_response.to_string())
            .create();

        let provider = GlmProvider::new(&server.url(), "test_token");
        let start = Local::now() - chrono::Duration::hours(24);
        let end = Local::now();
        let result = provider.fetch_model_usage_raw(&start, &end).await.unwrap();

        let data = result.get("data").unwrap();
        assert_eq!(data.get("granularity").and_then(|v| v.as_str()), Some("hourly"));

        let tokens = data.get("tokensUsage").unwrap().as_array().unwrap();
        assert_eq!(tokens[0], 13327683);

        let models = data.get("modelDataList").unwrap().as_array().unwrap();
        assert_eq!(models.len(), 3);
        assert_eq!(models[0].get("modelName").and_then(|v| v.as_str()), Some("GLM-5.1"));
        assert_eq!(models[0].get("totalTokens").and_then(|v| v.as_i64()), Some(38066416));

        let total = data.get("totalUsage").unwrap();
        assert_eq!(total.get("totalModelCallCount").and_then(|v| v.as_i64()), Some(374));
    }

    // Based on real month_raw API response (daily granularity)
    #[tokio::test]
    async fn test_fetch_model_usage_raw_daily() {
        let mut server = create_mock_server().await;

        let mock_response = json!({
            "code": 200,
            "data": {
                "granularity": "daily",
                "modelCallCount": [0, 16, 0, 32, 5],
                "modelDataList": [
                    {
                        "modelName": "GLM-5.1",
                        "sortOrder": 1,
                        "tokensUsage": [0, 0, 0, 0, 0],
                        "totalTokens": 294642077
                    },
                    {
                        "modelName": "GLM-4.7",
                        "sortOrder": 3,
                        "tokensUsage": [0, 689711, 0, 1748101, 319740],
                        "totalTokens": 127411819
                    }
                ],
                "tokensUsage": [0, 689711, 0, 1748101, 319740],
                "totalUsage": {
                    "totalModelCallCount": 53,
                    "totalTokensUsage": 422053896
                },
                "x_time": ["2026-03-20", "2026-03-21", "2026-03-22", "2026-03-23", "2026-03-24"]
            },
            "msg": "操作成功",
            "success": true
        });

        let _mock = server
            .mock("GET", mockito::Matcher::Regex(r"/api/monitor/usage/model-usage\?.*".to_string()))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(mock_response.to_string())
            .create();

        let provider = GlmProvider::new(&server.url(), "test_token");
        let start = Local::now() - chrono::Duration::days(30);
        let end = Local::now();
        let result = provider.fetch_model_usage_raw(&start, &end).await.unwrap();

        let data = result.get("data").unwrap();
        assert_eq!(data.get("granularity").and_then(|v| v.as_str()), Some("daily"));
        let x_time = data.get("x_time").unwrap().as_array().unwrap();
        assert!(x_time[0].as_str().unwrap().contains("2026-03-20"));
    }

    // Based on real quota API: five_hour_percentage=68, mcp 27/100
    #[tokio::test]
    async fn test_fetch_quota_limit() {
        let mut server = create_mock_server().await;

        let mock_response = json!({
            "code": 200,
            "data": {
                "limits": [
                    {
                        "type": "TOKENS_LIMIT",
                        "percentage": 68,
                        "nextResetTime": 1713458160000i64
                    },
                    {
                        "type": "TIME_LIMIT",
                        "percentage": 27,
                        "currentValue": 27,
                        "usage": 100,
                        "nextResetTime": 1716079740000i64,
                        "usageDetails": [
                            { "modelCode": "search-prime", "usage": 17 },
                            { "modelCode": "web-reader", "usage": 3 },
                            { "modelCode": "zread", "usage": 7 }
                        ]
                    }
                ]
            },
            "success": true
        });

        let _mock = server
            .mock("GET", "/api/monitor/usage/quota/limit")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(mock_response.to_string())
            .create();

        let provider = GlmProvider::new(&server.url(), "test_token");
        let quota = provider.fetch_quota_limit().await.unwrap();

        assert_eq!(quota.five_hour_percentage, 68.0);
        assert!(quota.five_hour_reset_at.is_some());
        assert_eq!(quota.mcp_percentage, 27.0);
        assert_eq!(quota.mcp_monthly_used, 27);
        assert_eq!(quota.mcp_monthly_total, 100);
        assert!(quota.mcp_monthly_reset_at.is_some());

        let details = quota.mcp_usage_details.unwrap();
        let arr = details.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0].get("modelCode").and_then(|v| v.as_str()), Some("search-prime"));
        assert_eq!(arr[0].get("usage").and_then(|v| v.as_i64()), Some(17));
    }

    #[tokio::test]
    async fn test_fetch_quota_limit_error() {
        let mut server = create_mock_server().await;

        let _mock = server
            .mock("GET", "/api/monitor/usage/quota/limit")
            .with_status(401)
            .with_body("Unauthorized")
            .create();

        let provider = GlmProvider::new(&server.url(), "invalid_token");
        assert!(provider.fetch_quota_limit().await.is_err());
    }

    #[tokio::test]
    async fn test_quota_percentage_edge_cases() {
        for pct in [0, 50, 100] {
            let mut server = create_mock_server().await;

            let mock_response = json!({
                "code": 200,
                "data": {
                    "limits": [
                        { "type": "TOKENS_LIMIT", "percentage": pct, "nextResetTime": 1713458160000i64 }
                    ]
                },
                "success": true
            });

            let _mock = server
                .mock("GET", "/api/monitor/usage/quota/limit")
                .with_status(200)
                .with_header("content-type", "application/json")
                .with_body(mock_response.to_string())
                .create();

            let provider = GlmProvider::new(&server.url(), "test_token");
            let quota = provider.fetch_quota_limit().await.unwrap();
            assert_eq!(quota.five_hour_percentage, pct as f64);
        }
    }

    #[tokio::test]
    async fn test_send_hi() {
        let mut server = create_mock_server().await;

        let mock_response = json!({
            "choices": [{ "message": { "role": "assistant", "content": "Hi!" } }]
        });

        let _mock = server
            .mock("POST", mockito::Matcher::Regex(r"/api/.*chat/completions".to_string()))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(mock_response.to_string())
            .create();

        let provider = GlmProvider::new(&server.url(), "test_token");
        assert!(provider.send_hi().await.is_ok());
    }
}
