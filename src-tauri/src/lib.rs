mod providers;

use providers::{glm::GlmProvider, provider::Provider};
use chrono::Timelike;
use std::sync::Mutex;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder},
    Emitter, Manager, Position, Rect, RunEvent, Size,
};
use tauri_plugin_notification::NotificationExt;

struct AutoHiState {
    enabled: bool,
    times: Vec<String>,
    last_triggered: Option<String>,
}

struct AppState {
    auto_hi: Mutex<AutoHiState>,
}

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

#[tauri::command]
fn test_notification(app: tauri::AppHandle) -> Result<String, String> {
    app.notification()
        .builder()
        .title("Quota Lens")
        .body("Rust 端通知测试")
        .show()
        .map_err(|e| format!("Notification error: {}", e))?;
    Ok("sent".to_string())
}

#[tauri::command]
fn notify(title: String, body: String) -> Result<String, String> {
    let escaped_title = title.replace('\\', "\\\\").replace('"', "\\\"");
    let escaped_body = body.replace('\\', "\\\\").replace('"', "\\\"");
    let script = format!(
        "display notification \"{}\" with title \"{}\"",
        escaped_body, escaped_title
    );
    std::process::Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("osascript error: {}", e))?;
    Ok("sent".to_string())
}

#[tauri::command]
fn update_tray_title(app: tauri::AppHandle, title: String) {
    if let Some(tray) = app.tray_by_id("main") {
        if title.is_empty() {
            let _ = tray.set_title(Some(""));
        } else {
            let _ = tray.set_title(Some(&title));
        }
    }
}

#[tauri::command]
async fn send_hi_message(base_url: String, auth_token: String) -> Result<String, String> {
    let provider = GlmProvider::new(&base_url, &auth_token);
    provider.send_hi().await?;
    Ok("ok".to_string())
}

#[tauri::command]
fn update_auto_hi_config(app: tauri::AppHandle, enabled: bool, times: Vec<String>) {
    if let Some(state) = app.try_state::<AppState>() {
        let mut auto_hi = state.auto_hi.lock().unwrap();
        auto_hi.enabled = enabled;
        auto_hi.times = times;
    }
}

#[tauri::command]
fn get_auto_hi_config(app: tauri::AppHandle) -> (bool, Vec<String>) {
    if let Some(state) = app.try_state::<AppState>() {
        let auto_hi = state.auto_hi.lock().unwrap();
        (auto_hi.enabled, auto_hi.times.clone())
    } else {
        (false, vec![])
    }
}

fn toggle_window(app: &tauri::AppHandle, tray_rect: Option<Rect>) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let window_size = window.outer_size().ok();

            if let (Some(rect), Some(size)) = (tray_rect, window_size) {
                let (tray_x, tray_y) = match rect.position {
                    Position::Physical(position) => (position.x as f64, position.y as f64),
                    Position::Logical(position) => (position.x, position.y),
                };
                let (tray_width, tray_height) = match rect.size {
                    Size::Physical(size) => (size.width as f64, size.height as f64),
                    Size::Logical(size) => (size.width, size.height),
                };

                let x = tray_x.round() as i32;
                let y = (tray_y + tray_height + 6.0).round() as i32;
                let _ = window.set_position(Position::Physical(
                    tauri::PhysicalPosition::new(x, y),
                ));
            } else {
                let x = if let Some(monitor) = window.primary_monitor().ok().flatten() {
                    let scale = monitor.scale_factor() as f64;
                    let size = monitor.size();
                    let screen_w = size.width as f64 / scale;
                    let win_w = window.inner_size().map(|s| s.width as f64 / scale).unwrap_or(320.0);
                    (screen_w - win_w) / 2.0
                } else {
                    0.0
                };
                let y = 25.0;
                let _ = window.set_position(tauri::Position::Logical(
                    tauri::LogicalPosition::new(x, y),
                ));
            }

            let _ = window.show();
            let _ = window.set_focus();
            let _ = app.emit("window-shown", ());
        }
    }
}

fn start_daily_summary_scheduler(app: tauri::AppHandle) {
    let app_clone = app.clone();
    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("Failed to create tokio runtime");
        rt.block_on(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                let _ = app_clone.emit("check-daily-summary", ());
            }
        });
    });
}

fn check_and_trigger_auto_hi(app: tauri::AppHandle) {
    let now = chrono::Local::now();
    let current_time = now.format("%H:%M").to_string();

    let (enabled, times) = {
        if let Some(ref state) = app.try_state::<AppState>() {
            let auto_hi = state.auto_hi.lock().unwrap();
            (auto_hi.enabled, auto_hi.times.clone())
        } else {
            (false, vec![])
        }
    };

    if !enabled {
        println!("[Auto-Hi] Disabled, skipping check at {}", current_time);
        return;
    }

    if !times.contains(&current_time) {
        println!("[Auto-Hi] {} not in configured times ({:?}), skipping", current_time, times);
        return;
    }

    // Check if we already triggered this time slot
    let last_triggered = {
        if let Some(ref state) = app.try_state::<AppState>() {
            let auto_hi = state.auto_hi.lock().unwrap();
            auto_hi.last_triggered.clone()
        } else {
            None
        }
    };

    if last_triggered == Some(current_time.clone()) {
        println!("[Auto-Hi] Already triggered at {}, skipping", current_time);
        return;
    }

    println!("[Auto-Hi] Triggering at {}", current_time);

    // Mark as triggered and emit event
    if let Some(ref state) = app.try_state::<AppState>() {
        let mut auto_hi = state.auto_hi.lock().unwrap();
        auto_hi.last_triggered = Some(current_time.clone());
    }

    let _ = app.emit("trigger-auto-hi", ());
    println!("[Auto-Hi] Event emitted successfully");
}

fn start_auto_hi_scheduler(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("Failed to create tokio runtime");
        rt.block_on(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));

            // Check immediately on startup
            check_and_trigger_auto_hi(app.clone());

            loop {
                interval.tick().await;
                check_and_trigger_auto_hi(app.clone());
            }
        });
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState {
            auto_hi: Mutex::new(AutoHiState {
                enabled: true,
                times: vec!["07:00".to_string(), "12:00".to_string(), "17:00".to_string(), "22:00".to_string()],
                last_triggered: None,
            }),
        })
        .invoke_handler(tauri::generate_handler![
            fetch_usage,
            fetch_all_usage,
            send_daily_summary,
            debug_raw_usage,
            quit_app,
            send_hi_message,
            update_auto_hi_config,
            update_tray_title,
            test_notification,
            notify
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
                        rect,
                        ..
                    } = event {
                        toggle_window(tray.app_handle(), Some(rect));
                    }
                })
                .build(app)?;

            // Start daily summary background checker
            start_daily_summary_scheduler(app.handle().clone());

            // Start auto-hi background scheduler
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                start_auto_hi_scheduler(app_handle);
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let RunEvent::ExitRequested { api, code, .. } = event {
                if code.is_some() {
                    return;
                }
                api.prevent_exit();
            }
        });
}
