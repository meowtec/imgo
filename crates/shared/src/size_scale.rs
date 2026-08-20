use crate::types::{ResizeType, Size};

pub fn scale_by(base: u32, scale: f64) -> u32 {
  let target = (base as f64 * scale).round() as u32;

  if target < 1 {
    1
  } else {
    target
  }
}

pub fn scale_by_2(base: u32, base_eg: u32, target_eg: u32) -> u32 {
  scale_by(base, target_eg as f64 / base_eg as f64)
}

impl Size {
  pub fn new(width: u32, height: u32) -> Self {
    Size { width, height }
  }

  pub fn is_valid(&self) -> bool {
    self.width > 0 || self.height > 0
  }

  pub fn is_exact(&self) -> bool {
    self.width > 0 && self.height > 0
  }

  pub fn resize(&self, size: Size, resize_type: ResizeType) -> Size {
    if size.width == 0 && size.height == 0 {
      return self.clone();
    }

    if (resize_type != ResizeType::Exact)
      && (self.width < size.width || size.width == 0)
      && (self.height < size.height || size.height == 0)
    {
      return self.clone();
    }

    if size.width == 0 {
      return Size {
        width: scale_by_2(self.width, self.height, size.height),
        height: size.height,
      };
    }

    if size.height == 0 {
      return Size {
        width: size.width,
        height: scale_by_2(self.height, self.width, size.width),
      };
    }

    match resize_type {
      ResizeType::Exact => size,
      // 将 self 缩小到完全小于 size 的尺寸
      ResizeType::DownsizeContain => {
        let scale = (size.width as f64 / self.width as f64)
          .min(size.height as f64 / self.height as f64)
          .min(1.0);

        Size {
          width: scale_by(self.width, scale),
          height: scale_by(self.height, scale),
        }
      }
      // 将 self 缩小到完全大于 size 的尺寸
      ResizeType::DownsizeCover => {
        let scale = (size.width as f64 / self.width as f64)
          .max(size.height as f64 / self.height as f64)
          .min(1.0);

        Size {
          width: scale_by(self.width, scale),
          height: scale_by(self.height, scale),
        }
      }
    }
  }
}

impl From<(u32, u32)> for Size {
  fn from(value: (u32, u32)) -> Self {
    Size {
      width: value.0,
      height: value.1,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::types::ResizeType;

  use super::*;

  #[test]
  fn size_scale_exact() {
    let size = Size::new(100, 300);

    assert_eq!(
      size.resize(Size::new(55, 55), ResizeType::Exact),
      Size::new(55, 55)
    );

    assert_eq!(
      size.resize(Size::new(0, 100), ResizeType::Exact),
      Size::new(33, 100)
    );

    assert_eq!(
      size.resize(Size::new(50, 0), ResizeType::Exact),
      Size::new(50, 150)
    );

    assert_eq!(
      size.resize(Size::new(150, 0), ResizeType::Exact),
      Size::new(150, 450)
    );

    assert_eq!(
      size.resize(Size::new(0, 600), ResizeType::Exact),
      Size::new(200, 600)
    );

    assert_eq!(
      size.resize(Size::new(0, 0), ResizeType::Exact),
      Size::new(100, 300)
    );
  }

  #[test]
  fn size_scale_to_0() {
    let size = Size::new(100, 300);
    let resized = size.resize(Size::new(0, 1), ResizeType::Exact);
    assert_eq!(resized, Size::new(1, 1));
  }

  #[test]
  fn size_scale_contain() {
    let size = Size::new(100, 300);

    assert_eq!(
      size.resize(
        Size::new(50, 100),
        ResizeType::DownsizeContain
      ),
      Size::new(33, 100)
    );

    assert_eq!(
      size.resize(
        Size::new(100, 100),
        ResizeType::DownsizeContain
      ),
      Size::new(33, 100)
    );

    assert_eq!(
      size.resize(
        Size::new(200, 100),
        ResizeType::DownsizeContain
      ),
      Size::new(33, 100)
    );

    assert_eq!(
      size.resize(
        Size::new(100, 200),
        ResizeType::DownsizeContain
      ),
      Size::new(67, 200)
    );

    assert_eq!(
      size.resize(
        Size::new(50, 200),
        ResizeType::DownsizeContain
      ),
      Size::new(50, 150)
    );

    assert_eq!(
      size.resize(
        Size::new(50, 500),
        ResizeType::DownsizeContain
      ),
      Size::new(50, 150)
    );

    assert_eq!(
      size.resize(
        Size::new(200, 500),
        ResizeType::DownsizeContain
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(50, 0),
        ResizeType::DownsizeContain
      ),
      Size::new(50, 150)
    );

    assert_eq!(
      size.resize(
        Size::new(100, 0),
        ResizeType::DownsizeContain
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(200, 0),
        ResizeType::DownsizeContain
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 200),
        ResizeType::DownsizeContain
      ),
      Size::new(67, 200)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 300),
        ResizeType::DownsizeContain
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 400),
        ResizeType::DownsizeContain
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 0),
        ResizeType::DownsizeContain
      ),
      Size::new(100, 300)
    );
  }

  #[test]
  fn size_scale_cover() {
    let size = Size::new(100, 300);

    assert_eq!(
      size.resize(
        Size::new(50, 100),
        ResizeType::DownsizeCover
      ),
      Size::new(50, 150)
    );

    assert_eq!(
      size.resize(
        Size::new(100, 100),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(200, 100),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(100, 200),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(50, 200),
        ResizeType::DownsizeCover
      ),
      Size::new(67, 200)
    );

    assert_eq!(
      size.resize(
        Size::new(50, 500),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(200, 500),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(50, 0),
        ResizeType::DownsizeCover
      ),
      Size::new(50, 150)
    );

    assert_eq!(
      size.resize(
        Size::new(100, 0),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(200, 0),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 200),
        ResizeType::DownsizeCover
      ),
      Size::new(67, 200)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 300),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 400),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );

    assert_eq!(
      size.resize(
        Size::new(0, 0),
        ResizeType::DownsizeCover
      ),
      Size::new(100, 300)
    );
  }
}
