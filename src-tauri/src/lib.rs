mod animation;
mod state;
mod tokscale;
mod tray;

use serde::Serialize;
use state::{AppState, CacheEntry};
use std::sync::Arc;
use std::time::Duration;
use tauri::{async_runtime, Emitter, Manager};

const REFRESH_SECS: u64 = 180;
const ONESHOT_MAX_AGE_SECS: u64 = 30;

#[derive(Clone, Serialize)]
pub struct GraphPayload {
    pub year: String,
    #[serde(rename = "fetchedAt")]
    pub fetched_at: String,
    pub payload: serde_json::Value,
}

#[tauri::command]
async fn get_graph(
    year: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<GraphPayload, String> {
    let max_age = Duration::from_secs(ONESHOT_MAX_AGE_SECS);
    if let Some(CacheEntry { data, fetched_at }) = state.get(&year, max_age) {
        return Ok(GraphPayload {
            year: year.clone(),
            fetched_at,
            payload: data,
        });
    }
    let year_clone = year.clone();
    let data = async_runtime::spawn_blocking(move || tokscale::run(&year_clone))
        .await
        .map_err(|e| format!("join: {}", e))??;
    let entry = state.put(year.clone(), data);
    Ok(GraphPayload {
        year,
        fetched_at: entry.fetched_at,
        payload: entry.data,
    })
}

#[tauri::command]
async fn refresh_graph(
    year: String,
    state: tauri::State<'_, Arc<AppState>>,
    app: tauri::AppHandle,
) -> Result<GraphPayload, String> {
    let year_clone = year.clone();
    let data = async_runtime::spawn_blocking(move || tokscale::run(&year_clone))
        .await
        .map_err(|e| format!("join: {}", e))??;
    let entry = state.put(year.clone(), data);
    let payload = GraphPayload {
        year: year.clone(),
        fetched_at: entry.fetched_at,
        payload: entry.data,
    };
    let _ = app.emit("graph-update", &payload);
    Ok(payload)
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn set_animate_tray(enabled: bool, state: tauri::State<'_, Arc<AppState>>) {
    state.set_animate_enabled(enabled);
}

#[tauri::command]
fn set_animation_style(style: String, state: tauri::State<'_, Arc<AppState>>) {
    let code = match style.as_str() {
        "cat" => 1u32,
        _ => 0u32,
    };
    state.set_animation_style(code);
}

fn spawn_refresh_loop(app: tauri::AppHandle, state: Arc<AppState>) {
    async_runtime::spawn(async move {
        let mut tick = tokio::time::interval(Duration::from_secs(REFRESH_SECS));
        tick.tick().await; // immediate first tick
        loop {
            tick.tick().await;
            let years = state.known_years();
            for year in years {
                let s = state.clone();
                let app = app.clone();
                let y = year.clone();
                let res = async_runtime::spawn_blocking(move || tokscale::run(&y)).await;
                if let Ok(Ok(data)) = res {
                    let entry = s.put(year.clone(), data);
                    let payload = GraphPayload {
                        year: year.clone(),
                        fetched_at: entry.fetched_at,
                        payload: entry.data,
                    };
                    let _ = app.emit("graph-update", &payload);
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = tray::refresh_tray_title(&app, &payload, &window);
                    }
                }
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState::new();
    let state_clone = state.clone();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .manage(state.clone())
        .invoke_handler(tauri::generate_handler![
            get_graph,
            refresh_graph,
            quit_app,
            set_animate_tray,
            set_animation_style,
            tray::update_tray_title
        ]);

    builder = builder.setup(move |app| {
        // Hide from Dock on macOS (LSUIElement equivalent).
        #[cfg(target_os = "macos")]
        {
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
        }
        let handle = app.handle().clone();
        tray::setup(&handle)?;
        spawn_refresh_loop(handle.clone(), state_clone.clone());
        animation::spawn_animation_loop(handle.clone(), state_clone.clone());
        Ok(())
    });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
