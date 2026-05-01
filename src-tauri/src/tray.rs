use crate::GraphPayload;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, LogicalPosition, Manager, PhysicalPosition, PhysicalSize, Runtime, WebviewWindow,
};

const POPOVER_W: f64 = 940.0;
const POPOVER_H: f64 = 600.0;

pub fn setup<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let quit = MenuItem::with_id(app, "quit", "Quit Tokscale", true, Some("Cmd+Q"))?;
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().cloned().unwrap())
        .icon_as_template(true)
        .title("…")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    if let Some(tray) = app.tray_by_id("main-tray") {
                        let _ = position_window_under_tray(&tray, &w);
                    }
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(w) = app.get_webview_window("main") {
                    let visible = w.is_visible().unwrap_or(false);
                    if visible {
                        let _ = w.hide();
                    } else {
                        let _ = position_window_under_tray(tray, &w);
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            }
        })
        .build(app)?;
    Ok(())
}

fn position_window_under_tray<R: Runtime>(
    tray: &tauri::tray::TrayIcon<R>,
    window: &WebviewWindow<R>,
) -> tauri::Result<()> {
    let rect = match tray.rect()? {
        Some(r) => r,
        None => return Ok(()),
    };

    let scale = window.scale_factor().unwrap_or(1.0);
    let pos: PhysicalPosition<f64> = rect.position.to_physical(scale);
    let size: PhysicalSize<f64> = rect.size.to_physical(scale);
    let tray_x_logical = pos.x / scale;
    let tray_y_logical = pos.y / scale;
    let tray_w_logical = size.width / scale;
    let tray_h_logical = size.height / scale;

    // Center popover horizontally under the tray icon
    let mut x = tray_x_logical + (tray_w_logical - POPOVER_W) / 2.0;
    let y = tray_y_logical + tray_h_logical + 6.0;

    // Clamp to monitor bounds
    if let Ok(Some(monitor)) = window.current_monitor() {
        let m_pos = monitor.position();
        let m_size = monitor.size();
        let m_scale = monitor.scale_factor();
        let m_x = m_pos.x as f64 / m_scale;
        let m_w = m_size.width as f64 / m_scale;
        let max_x = m_x + m_w - POPOVER_W - 8.0;
        let min_x = m_x + 8.0;
        if x > max_x {
            x = max_x;
        }
        if x < min_x {
            x = min_x;
        }
    }

    let _ = window.set_size(tauri::LogicalSize::new(POPOVER_W, POPOVER_H));
    window.set_position(LogicalPosition::new(x, y))?;
    Ok(())
}

pub fn refresh_tray_title<R: Runtime>(
    app: &AppHandle<R>,
    _payload: &GraphPayload,
    _window: &WebviewWindow<R>,
) -> tauri::Result<()> {
    // Title is computed and pushed from frontend via update_tray_title.
    // This is a placeholder hook for future server-side formatting.
    let _ = app;
    Ok(())
}

#[tauri::command]
pub fn update_tray_title(app: AppHandle, title: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_title(Some(title)).map_err(|e| e.to_string())?;
    }
    Ok(())
}
