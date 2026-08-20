use tauri::{
  menu::{Menu, MenuBuilder, MenuItem, SubmenuBuilder},
  App,
};

use crate::i18n::I18n;

pub mod menu_key {
  pub const OPEN: &str = "open";
  pub const OPEN_DIR: &str = "open_dir";
  pub const SAVE: &str = "save";
  pub const SAVE_NEW_FILE: &str = "save_new_file";
  pub const SAVE_TO_DIR: &str = "save_to_dir";
  pub const ABOUT: &str = "about";
}

pub fn create_menu(app: &App, i18n: &I18n) -> Menu<tauri::Wry> {
  let menu_app = SubmenuBuilder::new(app, "IMGo")
    .about(None)
    .quit()
    .build()
    .unwrap();

  let menu_file = SubmenuBuilder::new(app, i18n.text("file"))
    .item(
      &MenuItem::with_id(
        app,
        menu_key::OPEN,
        i18n.text("open"),
        true,
        None::<&str>,
      )
      .unwrap(),
    )
    .item(
      &MenuItem::with_id(
        app,
        menu_key::OPEN_DIR,
        i18n.text("open_dir"),
        true,
        None::<&str>,
      )
      .unwrap(),
    )
    .item(
      &MenuItem::with_id(
        app,
        menu_key::SAVE,
        i18n.text("save"),
        true,
        None::<&str>,
      )
      .unwrap(),
    )
    .item(
      &MenuItem::with_id(
        app,
        menu_key::SAVE_NEW_FILE,
        i18n.text("save_new_file"),
        true,
        None::<&str>,
      )
      .unwrap(),
    )
    .item(
      &MenuItem::with_id(
        app,
        menu_key::SAVE_TO_DIR,
        i18n.text("save_to_dir"),
        true,
        None::<&str>,
      )
      .unwrap(),
    )
    .build()
    .unwrap();

  MenuBuilder::new(app)
    .item(&menu_app)
    .item(&menu_file)
    .build()
    .unwrap()
}
