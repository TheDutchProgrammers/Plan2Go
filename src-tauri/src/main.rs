#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(desktop)]
//use tauri::{SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent, CustomMenuItem, Manager, RunEvent, WindowEvent};
use tauri::{tray::{TrayIconBuilder, ClickType}, menu::{MenuBuilder, MenuItem}, Manager, RunEvent, WindowEvent};
use tauri_plugin_dialog::DialogExt;

#[cfg(desktop)]
fn main() {
/*
  let hide = CustomMenuItem::new("togglehideshow".to_string(), "Hide");
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let tray_menu = SystemTrayMenu::new()
    .add_item(hide)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  tauri::Builder::default()
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
            tauri::api::dialog::ask(Some(&window), "Plan2Go Exiting", "Do you want to completely quit [YES] or just continue in background [NO]?", |answer| {
              if answer {
                // .close() cannot be called on the main thread
                std::thread::spawn(move || {
                  window.close().unwrap();
                  app_handle.exit(0);
                });
              } else {
                std::thread::spawn(move || {
                  window.hide().unwrap();
                  let item_handle = app.tray_handle().get_item("togglehideshow");
                  item_handle.set_text("Show").unwrap();
                });
              }
            });
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
*/
  //app::AppBuilder::new().run();
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_notification::init())
    .setup(|app| {
      let hide = MenuItem::with_id(app, "togglehideshow", "Hide", true, None);
      let quit = MenuItem::with_id(app, "quit", "Quit", true, None);
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
        .on_tray_event(move |tray, event| {
          if event.click_type == ClickType::Double {
            let app = tray.app_handle();
            if let Some(window) = app.get_window("main") {
              window.show().unwrap();
              window.set_focus().unwrap();
              tray_menu.get("togglehideshow").unwrap().as_menuitem().unwrap().set_text("Hide").unwrap();
            }
          }
        })
        .on_menu_event(move |app, event| match event.id.as_ref() {
          "quit" => {
            app.exit(0);
          }
          "togglehideshow" => {
            let window = app.get_window("main").unwrap();
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
      Ok(())
    })
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
          let window = app_handle.get_window(&label).unwrap();

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
        //let menu = app_handle.menu().unwrap();
        //let toggler = menu.get("togglehideshow").unwrap();
        //let hide = toggler.as_menuitem().unwrap();
        //hide.set_text("Show").unwrap();
      }
      _ => {}
    }); // End of '.run(..., {'
}

#[cfg(mobile)]
fn main() {
  app::AppBuilder::new().run();
}

