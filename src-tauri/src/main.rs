#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(desktop)]
use tauri::{SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent, CustomMenuItem, Manager, api::dialog::ask, RunEvent, WindowEvent};

fn main() {
  let builder = tauri::Builder::default();
  //builder = app::AppBuilder::new();
  if cfg!(desktop) {
    let hide = CustomMenuItem::new("togglehideshow".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new()
      .add_item(hide)
      .add_native_item(SystemTrayMenuItem::Separator)
      .add_item(quit);
    builder
      .system_tray(SystemTray::new().with_menu(tray_menu))
      .on_system_tray_event(|app, event| match event {
        SystemTrayEvent::LeftClick {
          position: _,
          size: _,
          ..
        } => {}
        SystemTrayEvent::RightClick {
          position: _,
          size: _,
          ..
        } => {}
        SystemTrayEvent::DoubleClick {
          position: _,
          size: _,
          ..
        } => {
          let window = app.get_window("main").unwrap();
          window.show().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
          // get a handle to the clicked menu item
          // note that `tray_handle` can be called anywhere,
          // just get an `AppHandle` instance with `app.handle()` on the setup hook
          // and move it to another function or thread
          let item_handle = app.tray_handle().get_item(&id);
          match id.as_str() {
            "quit" => {
              std::process::exit(0);
            }
            "togglehideshow" => {
              let window = app.get_window("main").unwrap();
              if window.is_visible().unwrap() {
                window.hide().unwrap();
                // you can also `set_selected`, `set_enabled` and `set_native_image` (macOS only).
                item_handle.set_title("Show").unwrap();
              } else {
                window.show().unwrap();
                item_handle.set_title("Hide").unwrap();
              }
            }
            _ => {}
          }
        }
        _ => {}
      }) // End of 'on_system_tray_event'
      .build(tauri::generate_context!())
      .expect("error while building tauri application")
      .run(|app_handle, event| match event {
        // Triggered when a window is trying to close
        RunEvent::WindowEvent {
          label,
          event: WindowEvent::CloseRequested { api, .. },
          ..
        } => {
          // for other windows, we handle it in JS
          if label == "main" {
            let app_handle = app_handle.clone();
            let window = app_handle.get_window(&label).unwrap();
            // use the exposed close api, and prevent the event loop to close
            api.prevent_close();
            // ask the user if he wants to quit
            ask(
              Some(&window),
              "Plan2Go Closing",
              "Do you want to completely quit [YES] or just continue in background [NO]?",
              move |answer| {
                if answer {
                  // .close() cannot be called on the main thread
                  std::thread::spawn(move || {
                    app_handle.get_window(&label).unwrap().close().unwrap();
                    app_handle.exit(0);
                  });
                } else {
                  std::thread::spawn(move || {
                    app_handle.get_window(&label).unwrap().hide().unwrap();
                    let item_handle = app_handle.tray_handle().get_item("togglehideshow");
                    item_handle.set_title("Show").unwrap();
                  });
                }
              },
            );
          } // End of 'label == "main"'
        } // end of 'RunEvent::WindowEvent'
        
        // Keep the event loop running even if all windows are closed
        // This allow us to catch system tray events when there is no window
        RunEvent::ExitRequested { api, .. } => {
          api.prevent_exit();
          let item_handle = app_handle.tray_handle().get_item("togglehideshow");
          item_handle.set_title("Show").unwrap();
        }
        _ => {}
      }); // End of '.run(..., {'
  } else {
    builder
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
  }
}
