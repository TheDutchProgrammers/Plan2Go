#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(desktop)]
use tauri::{tray::{TrayIconBuilder, ClickType}, menu::{MenuBuilder, MenuItemBuilder}, Manager, RunEvent, WindowEvent};
use tauri_plugin_dialog::DialogExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_notification::init())
    .setup(|app| {
      #[cfg(desktop)]
      {
        app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

        let hide = MenuItemBuilder::with_id("togglehideshow", "Hide").build(app)?;
        let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
        let handle = app.handle();
        let tray_menu = MenuBuilder::new(handle)
          .item(&hide)
          .separator()
          .item(&quit)
          .build()
          .unwrap();

        _ = TrayIconBuilder::with_id("main")
          .tooltip("Plan2Go")
          .icon(app.default_window_icon().unwrap().clone())
          .menu(&tray_menu)
          .menu_on_left_click(false)
          .on_tray_icon_event(move |tray, event| {
            if event.click_type == ClickType::Double {
              let app = tray.app_handle();
              if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
                tray_menu.get("togglehideshow").unwrap().as_menuitem().unwrap().set_text("Hide").unwrap();
              }
            }
          })
          .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
              app.exit(0);
              std::process::exit(0);
            }
            "togglehideshow" => {
              let window = app.get_webview_window("main").unwrap();
              if window.is_visible().unwrap() {
                window.hide().unwrap();
                hide.set_text("Show").unwrap();
              } else {
                window.show().unwrap();
                hide.set_text("Hide").unwrap();
              }
            },
            &_ => {}
          })
          .build(app);
      }
      Ok(())
    });
  #[cfg(desktop)]
  {
    builder
      .build(tauri::generate_context!())
      .expect("error while building tauri application")
      .run(move |app_handle, event| match event {
        // Triggered when a window is trying to close
        RunEvent::WindowEvent {
          label,
          event: WindowEvent::CloseRequested { api, .. },
          ..
        } => {
          // for other windows, we handle it in JS
          if label == "main" {
            let app_handle = app_handle.clone();
            let window = app_handle.get_webview_window(&label).unwrap();

            // use the exposed close api, and prevent the event loop to close
            api.prevent_close();

            // ask the user if he wants to quit
            let mut builder = app_handle.dialog().message("Do you want to completely quit [YES] or just continue in background [NO]?");
            builder = builder.title("Plan2Go Exiting");
            builder = builder.ok_button_label("Yes");
            builder = builder.cancel_button_label("No");
            let answer = builder.blocking_show();
            if answer {
              // .close() cannot be called on the main thread
              std::thread::spawn(move || {
                window.close().unwrap();
                app_handle.exit(0);
                std::process::exit(0);
              });
            } else {
              std::thread::spawn(move || {
                window.hide().unwrap();
/*
                //let hide = app.tray_handle().get_item("togglehideshow");
                let menu = app_handle.menu().unwrap();
                let toggler = menu.get("togglehideshow").unwrap();
                let hide = toggler.as_menuitem().unwrap();
                hide.set_text("Show").unwrap();
*/
              });
            }
          } // End of 'label == "main"'
        } // end of 'RunEvent::WindowEvent'

        // Keep the event loop running even if all windows are closed
        // This allow us to catch system tray events when there is no window
        RunEvent::ExitRequested { api, .. } => {
          api.prevent_exit();
        }
        _ => {}
      }); // End of '.run(..., {'
  }
  #[cfg(not(desktop))]
  {
    builder
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
  }
}

