mod providers;

use providers::{glm::GlmProvider, provider::Provider};
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder},
    Emitter, Manager, RunEvent,
};

#[tauri::command]
async fn fetch_usage(
    base_url: String,
    auth_token: String,
    period: Option<String>,
) -> Result<serde_json::Value, String> {
    let provider = GlmProvider::new(&base_url, &auth_token);
    let now = chrono::Utc::now();
    let start = match period.as_deref() {
        Some("7d") => now - chrono::Duration::days(7),
        Some("30d") => now - chrono::Duration::days(30),
        _ => now - chrono::Duration::hours(24),
    };

    let model_usage = provider.fetch_model_usage_raw(&start, &now).await?;
    let tool_usage = provider.fetch_tool_usage(&start, &now).await?;
    let quota = provider.fetch_quota_limit().await?;

    Ok(serde_json::json!({
        "model_usage": model_usage,
        "tool_usage": tool_usage,
        "quota": quota,
    }))
}

#[tauri::command]
async fn fetch_all_usage(
    base_url: String,
    auth_token: String,
) -> Result<serde_json::Value, String> {
    let provider = GlmProvider::new(&base_url, &auth_token);
    let now = chrono::Utc::now();

    let today_start = now - chrono::Duration::hours(chrono::Timelike::hour(&now) as i64 + 1);
    let week_start = now - chrono::Duration::days(7);
    let month_start = now - chrono::Duration::days(30);

    let (today_raw, week_raw, month_raw, quota) = tokio::join!(
        provider.fetch_model_usage_raw(&today_start, &now),
        provider.fetch_model_usage_raw(&week_start, &now),
        provider.fetch_model_usage_raw(&month_start, &now),
        provider.fetch_quota_limit(),
    );

    Ok(serde_json::json!({
        "today_raw": today_raw.map_err(|e| e)?,
        "week_raw": week_raw.map_err(|e| e)?,
        "month_raw": month_raw.map_err(|e| e)?,
        "quota": quota.map_err(|e| e)?,
    }))
}

#[tauri::command]
async fn debug_raw_usage(
    base_url: String,
    auth_token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let now = chrono::Utc::now();
    let start = now - chrono::Duration::hours(24);

    let model_url = format!(
        "{}/api/monitor/usage/model-usage?startTime={}&endTime={}",
        base_url,
        urlencoding::encode(&start.format("%Y-%m-%d %H:%M:%S").to_string()),
        urlencoding::encode(&now.format("%Y-%m-%d %H:%M:%S").to_string()),
    );

    let model_resp = client
        .get(&model_url)
        .header("Authorization", &auth_token)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("{}", e))?;

    let model_raw: serde_json::Value = model_resp.json().await.map_err(|e| format!("{}", e))?;

    let quota_url = format!("{}/api/monitor/usage/quota/limit", base_url);
    let quota_resp = client
        .get(&quota_url)
        .header("Authorization", &auth_token)
        .send()
        .await
        .map_err(|e| format!("{}", e))?;

    let quota_raw: serde_json::Value = quota_resp.json().await.map_err(|e| format!("{}", e))?;

    Ok(serde_json::json!({
        "model_usage_raw": model_raw,
        "quota_limit_raw": quota_raw,
    }))
}

#[tauri::command]
async fn send_daily_summary(
    base_url: String,
    auth_token: String,
) -> Result<String, String> {
    let provider = GlmProvider::new(&base_url, &auth_token);
    let now = chrono::Utc::now();
    let today_start = now - chrono::Duration::hours(chrono::Timelike::hour(&now) as i64 + 1);

    let usage_raw = provider.fetch_model_usage_raw(&today_start, &now).await?;
    let quota = provider.fetch_quota_limit().await?;

    let msg = format!(
        "5h额度: {:.0}% | MCP: {}/{}",
        quota.five_hour_percentage,
        quota.mcp_monthly_used,
        quota.mcp_monthly_total,
    );

    Ok(msg)
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            // Position below macOS menu bar (height ~25px), centered horizontally
            let x = if let Some(monitor) = window.primary_monitor().ok().flatten() {
                let scale = monitor.scale_factor() as f64;
                let size = monitor.size();
                let screen_w = size.width as f64 / scale;
                let win_w = window.inner_size().map(|s| s.width as f64 / scale).unwrap_or(320.0);
                (screen_w - win_w) / 2.0
            } else {
                0.0
            };
            let y = 25.0; // macOS menu bar height
            let _ = window.set_position(tauri::Position::Logical(
                tauri::LogicalPosition::new(x, y),
            ));
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

fn start_daily_summary_scheduler(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("Failed to create tokio runtime");
        rt.block_on(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                let _ = app.emit("check-daily-summary", ());
            }
        });
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            fetch_usage,
            fetch_all_usage,
            send_daily_summary,
            debug_raw_usage,
            quit_app
        ])
        .setup(|app| {
            // Hide window when focus is lost (click outside)
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(false) = event {
                    let _ = window_clone.hide();
                }
            });

            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .tooltip("Quota Lens")
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Start daily summary background checker
            start_daily_summary_scheduler(app.handle().clone());

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}
