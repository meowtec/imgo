use crate::i18n::I18n;
use tauri::{menu::AboutMetadata, App};

const HOMEPAGE: &str = "https://imgo.app/";

pub fn create_about_metadata(app: &App, i18n: &I18n) -> AboutMetadata<'static> {
  AboutMetadata {
    name: Some(app.package_info().name.clone()),
    version: Some(app.package_info().version.to_string()),
    website: Some(HOMEPAGE.to_string()),
    website_label: Some(i18n.text("visit").to_string()),
    credits: Some(HOMEPAGE.to_string()),
    ..Default::default()
  }
}
