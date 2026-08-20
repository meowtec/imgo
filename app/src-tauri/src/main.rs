#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::{
  env,
  path::PathBuf,
  sync::{Arc, RwLock},
};

use commands::{
  emit_file_add, pick_files, pick_folders, save_files::SaveFilesTriggerType, start_emit_file_add,
};
use i18n::I18n;
use log::{debug, LevelFilter};
use menu::{create_menu, menu_key};
use oss::{add_file_to_image, walk_dir_add_images};
use tauri::{path::BaseDirectory, Emitter, Manager, WindowEvent};
use tauri_plugin_dialog::DialogExt;

mod commands;
mod i18n;
mod menu;
mod message;
mod oss;
mod structs;
mod utils;

fn main() {
  let i18n = Arc::new(RwLock::new(I18n::new()));
  let i18n_w = i18n.clone();
  // let i18n_r = i18n.clone();

  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(
      tauri_plugin_log::Builder::new()
        .targets([
          tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: None }),
          // tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
          tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stderr),
          tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
        ])
        .level(LevelFilter::Debug)
        .build(),
    )
    .setup(move |app| {
      oss::setup(&app.path().resolve("oss", BaseDirectory::AppCache).unwrap());

      debug!("args: {:?}", std::env::args());
      let i18n_resource_path = app.path().resolve("i18n", BaseDirectory::Resource).unwrap();
      let i18n_src_path = PathBuf::from("i18n");
      let mut i18n = i18n_w.write().unwrap();

      i18n.load_dir_sys(if i18n_src_path.exists() {
        i18n_src_path
      } else {
        i18n_resource_path
      });

      app.set_menu(create_menu(app, &i18n)).expect("set menu");

      let webview_builder = tauri::WebviewWindowBuilder::new(
        app,
        "main".to_string(),
        tauri::WebviewUrl::App("index.html".into()),
      )
      .initialization_script(&format!(
        "window.cacheImageRootPath = {}",
        serde_json::to_string(oss::get_root_path().to_str().unwrap()).unwrap()
      ))
      .title("IMGo")
      .inner_size(1140.0, 800.0)
      .min_inner_size(640.0, 360.0);

      #[cfg(all(not(debug_assertions), feature = "release-devtools"))]
      {
        let webview = webview_builder.build()?;
        if option_env!("IMGO_RELEASE_DEVTOOLS").is_some_and(|value| value == "1") {
          webview.open_devtools();
        }
      }

      #[cfg(not(all(not(debug_assertions), feature = "release-devtools")))]
      webview_builder.build()?;

      Ok(())
    })
    .on_window_event(move |window, event| match event {
      WindowEvent::CloseRequested { api, .. } => {
        api.prevent_close();
        let win = window.clone();
        window
          .app_handle()
          .dialog()
          .message("Close?")
          .kind(tauri_plugin_dialog::MessageDialogKind::Info)
          .buttons(tauri_plugin_dialog::MessageDialogButtons::YesNo)
          .show(move |confirmed| {
            if confirmed {
              oss::clear_all();
              win.destroy().ok();
            }
          });
      }
      WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, .. }) => {
        let id = start_emit_file_add(window, paths.len());
        let mut file_add_process_messager =
          message::FileAddProgressMessager::new(id.clone(), window);

        // 对 paths 进行 flat_map，如果是文件夹则调用 walk_dir_add_images;如果是文件则调用 add_file_to_image. 返回 Vec<ImageObject>
        let result = paths
          .iter()
          .flat_map(|path| {
            if path.is_dir() {
              walk_dir_add_images(path, &mut file_add_process_messager)
            } else {
              file_add_process_messager.process(path.file_name().unwrap_or_default());
              match add_file_to_image(path) {
                Ok(data) => vec![data],
                Err(err) => {
                  log::error!("prepare image failed: {:?}", err);
                  vec![]
                }
              }
            }
          })
          .collect::<Vec<_>>();

        debug!(
          "drop files: {:?}, to: {:?}",
          paths, &result
        );
        emit_file_add(window, id, result);
      }
      _ => {}
    })
    .on_menu_event(move |app_handle, event| {
      let menu_id = event.id();
      let app_handle_cloned = app_handle.clone();

      match menu_id.0.as_ref() {
        menu_key::ABOUT => {
          // show_about_dialog(&win, &i18n_r.read().unwrap());
        }
        menu_key::OPEN => {
          pick_files(app_handle_cloned);
        }
        menu_key::OPEN_DIR => {
          pick_folders(app_handle_cloned);
        }
        menu_key::SAVE => {
          app_handle
            .emit("save", SaveFilesTriggerType::Override)
            .unwrap();
        }
        menu_key::SAVE_NEW_FILE => {
          app_handle
            .emit(
              "save",
              SaveFilesTriggerType::AutoNewName,
            )
            .unwrap();
        }
        menu_key::SAVE_TO_DIR => {
          app_handle
            .emit("save", SaveFilesTriggerType::SaveToDir)
            .unwrap();
        }
        _ => (),
      }
    })
    .invoke_handler(tauri::generate_handler![
      commands::pick_files,
      commands::pick_folders,
      commands::optimize,
      commands::clear_all,
      commands::save_files,
      commands::clear_files,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
