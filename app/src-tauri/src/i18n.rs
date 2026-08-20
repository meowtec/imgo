use log::debug;
use std::{collections::HashMap, fs, io::Read, path::Path};
use sys_locale::get_locale;

const DEFAULT_LANG_CODE: &str = "en";
const JSON_EXT: &str = ".json";

pub struct I18n {
  texts_maps: Vec<HashMap<String, String>>,
}

fn parse_lang_code(raw: &str) -> (&str, Option<&str>) {
  let mut split = raw.split('-');

  (split.next().unwrap_or(""), split.next())
}

impl I18n {
  pub fn new() -> Self {
    Self { texts_maps: vec![] }
  }

  pub fn load_dir<T: AsRef<Path>>(&mut self, dir_path: T, locale: String) {
    let mut locale_texts_map: HashMap<_, _> = fs::read_dir(dir_path)
      .unwrap()
      .filter_map(|r| {
        r.ok().map(|f| f.path()).filter(|p| match p.to_str() {
          Some(path) => path.ends_with(JSON_EXT),
          None => false,
        })
      })
      .map(|f| {
        let locale = f
          .file_name()
          .unwrap()
          .to_str()
          .unwrap()
          .replace(JSON_EXT, "");
        let mut content = String::new();
        fs::File::open(f)
          .unwrap()
          .read_to_string(&mut content)
          .unwrap();
        let hash_map: HashMap<String, String> = serde_json::from_str(&content).unwrap();
        (locale, hash_map)
      })
      .collect();

    let (lang, _) = parse_lang_code(&locale);

    let texts_maps = [
      locale.clone(),
      lang.to_string(),
      DEFAULT_LANG_CODE.to_string(),
    ]
    .iter()
    .filter_map(|locale| locale_texts_map.remove(locale))
    .collect();

    self.texts_maps = texts_maps;
  }

  pub fn load_dir_sys<T: AsRef<Path>>(&mut self, dir_path: T) {
    debug!(
      "from_dir_sys: {}",
      dir_path.as_ref().to_str().unwrap_or("")
    );
    self.load_dir(
      dir_path,
      get_locale().unwrap_or_else(|| String::from(DEFAULT_LANG_CODE)),
    );
  }

  pub fn text<'a>(&'a self, key: &'a str) -> &'a str {
    let texts_maps = &self.texts_maps;
    texts_maps
      .iter()
      .find_map(|map| map.get(key).map(|val| val.as_str()))
      .unwrap_or(key)
  }

  #[allow(dead_code)]
  pub fn text_tpl(&self, key: &str, params: Vec<&str>) -> String {
    let text = self.text(key).to_string();
    params.iter().enumerate().fold(text, |acc, (index, &s)| {
      acc.replace(&format!("{{{}}}", index), s)
    })
  }
}

#[cfg(test)]
mod tests {
  use super::I18n;

  #[test]
  fn test_i18n() {
    let mut i18n = I18n::new();
    i18n.load_dir(
      "tests/fixtures/i18n",
      "zh-XX".to_string(),
    );
    assert_eq!(i18n.text("foo"), "佛");
    assert_eq!(i18n.text("bar"), "BAR");
    assert_eq!(
      i18n.text_tpl("hello", vec!["world"]),
      "雷猴 world"
    );
  }
}
