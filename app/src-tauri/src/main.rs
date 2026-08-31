#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::{
  env,
  ffi::OsString,
  path::{Path, PathBuf},
  sync::{Arc, Mutex, RwLock},
};

use commands::{
  emit_file_add, pick_files, pick_folders, save_files::SaveFilesTriggerType, start_emit_file_add,
};
use i18n::I18n;
use log::{debug, LevelFilter};
use menu::{create_menu, menu_key};
use oss::{add_file_to_image, walk_dir_add_images};
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager, Runtime, State, WindowEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

mod commands;
mod i18n;
mod menu;
mod message;
mod oss;
mod structs;
mod utils;

#[derive(Default)]
struct OpenedFilesState {
  frontend_ready: bool,
  pending: Vec<PathBuf>,
}

fn paths_from_args<I, S>(args: I, cwd: &Path) -> Vec<PathBuf>
where
  I: IntoIterator<Item = S>,
  S: Into<OsString>,
{
  args
    .into_iter()
    .skip(1)
    .map(|arg| {
      let path = PathBuf::from(arg.into());
      if path.is_absolute() {
        path
      } else {
        cwd.join(path)
      }
    })
    .filter(|path| path.exists())
    .collect()
}

fn add_paths<R: Runtime, T: Emitter<R>>(emitter: &T, paths: &[PathBuf]) {
  let id = start_emit_file_add(emitter, paths.len());
  let mut file_add_process_messager = message::FileAddProgressMessager::new(id.clone(), emitter);
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
    "add paths: {:?}, to: {:?}",
    paths, &result
  );
  emit_file_add(emitter, id, result);
}

fn handle_opened_files(app_handle: &AppHandle, paths: Vec<PathBuf>) {
  let state = app_handle.state::<Mutex<OpenedFilesState>>();
  let mut state = state.lock().unwrap();

  if !state.frontend_ready {
    state.pending.extend(paths);
    return;
  }

  drop(state);
  add_paths(app_handle, &paths);
}

fn show_main_window(app_handle: &AppHandle) {
  if let Some(window) = app_handle.get_webview_window("main") {
    window.unminimize().ok();
    window.show().ok();
    window.set_focus().ok();
  }
}

#[tauri::command]
fn frontend_ready(app_handle: AppHandle, state: State<Mutex<OpenedFilesState>>) {
  let mut state = state.lock().unwrap();
  state.frontend_ready = true;
  let paths = std::mem::take(&mut state.pending);
  drop(state);

  if !paths.is_empty() {
    add_paths(&app_handle, &paths);
  }
}

fn main() {
  let i18n = Arc::new(RwLock::new(I18n::new()));
  let i18n_w = i18n.clone();
  let i18n_r = i18n.clone();

  let app = tauri::Builder::default()
    .manage(Mutex::new(OpenedFilesState::default()))
    .plugin(tauri_plugin_single_instance::init(
      |app_handle, args, cwd| {
        let paths = paths_from_args(args, Path::new(&cwd));
        if !paths.is_empty() {
          handle_opened_files(app_handle, paths);
        }
        show_main_window(app_handle);
      },
    ))
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

      debug!("args: {:?}", env::args());
      let cwd = env::current_dir().unwrap_or_default();
      let paths = paths_from_args(env::args_os(), &cwd);
      if !paths.is_empty() {
        handle_opened_files(app.handle(), paths);
      }

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
        let (title, message, confirm_text, cancel_text) = {
          let i18n = i18n_r.read().unwrap();
          (
            i18n.text("conform_exit").to_string(),
            i18n.text("conform_exit_explain").to_string(),
            i18n.text("confirm").to_string(),
            i18n.text("cancel").to_string(),
          )
        };
        let window = window.clone();

        window
          .dialog()
          .message(message)
          .title(title)
          .kind(MessageDialogKind::Warning)
          .buttons(MessageDialogButtons::OkCancelCustom(
            confirm_text,
            cancel_text,
          ))
          .parent(&window)
          .show(move |confirmed| {
            if confirmed {
              oss::clear_all();
              window.destroy().expect("destroy main window");
            }
          });
      }
      WindowEvent::DragDrop(tauri::DragDropEvent::Drop { paths, .. }) => {
        add_paths(window, paths);
      }
      _ => {}
    })
    .on_menu_event(move |app_handle, event| {
      let menu_id = event.id();
      let app_handle_cloned = app_handle.clone();

      match menu_id.0.as_ref() {
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
      frontend_ready,
    ])
    .build(tauri::generate_context!())
    .expect("error while running tauri application");

  app.run(|app_handle, event| {
    #[cfg(target_os = "macos")]
    if let tauri::RunEvent::Opened { urls } = event {
      let paths = urls
        .into_iter()
        .filter_map(|url| url.to_file_path().ok())
        .collect::<Vec<_>>();

      if !paths.is_empty() {
        handle_opened_files(app_handle, paths);
      }

      show_main_window(app_handle);
    }
  });
}
