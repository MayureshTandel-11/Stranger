#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

const OVERLAY_LABEL: &str = "stranger_overlay";

fn toggle_overlay(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
            let _ = app.emit("overlay:hide", serde_json::json!({ "source": "native" }));
            let _ = app.emit(
                "state:update",
                serde_json::json!({ "state": "Idle", "source": "native" }),
            );
        } else {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = app.emit("overlay:show", serde_json::json!({ "source": "native" }));
            let _ = app.emit("wake.detected", serde_json::json!({ "source": "native-shortcut" }));
            let _ = app.emit(
                "state:update",
                serde_json::json!({ "state": "Listening", "source": "native" }),
            );
        }
    }
}

fn ensure_overlay_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(existing) = app.get_webview_window(OVERLAY_LABEL) {
        return Ok(existing);
    }

    WebviewWindowBuilder::new(app, OVERLAY_LABEL, tauri::WebviewUrl::App("index.html".into()))
        .title("Stranger")
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .visible(false)
        .inner_size(960.0, 600.0)
        .build()
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();

            let _window = ensure_overlay_window(&handle)?;

            let app_handle = handle.clone();
            handle.plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_shortcut(Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space))?
                    .with_handler(move |_app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            toggle_overlay(&app_handle);
                        }
                    })
                    .build(),
            )?;

            if let Some(icon) = app.default_window_icon().cloned() {
                let app_handle = handle.clone();
                TrayIconBuilder::with_id("stranger_tray")
                    .tooltip("Stranger")
                    .icon(icon)
                    .on_tray_icon_event(move |_tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            toggle_overlay(&app_handle);
                        }
                    })
                    .build(app)?;
            }

            let _ = handle.emit(
                "state:update",
                serde_json::json!({ "state": "Idle", "source": "native-startup" }),
            );

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
