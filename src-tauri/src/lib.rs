use tauri::{Builder, Manager};
use tokio::sync::Mutex;
use tokio::sync::broadcast::Sender;

mod subs_transfer;

struct AppState {
    subs_transfer_cancellation: Option<Sender<()>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState {
                subs_transfer_cancellation: None,
            }));
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            subs_transfer::transfer_subtitles,
            subs_transfer::cancel_transfer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
