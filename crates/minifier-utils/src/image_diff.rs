use std::fmt::Debug;

#[derive(Eq, PartialEq, Debug, Clone)]
pub struct Rect {
  pub x: u32,
  pub y: u32,
  pub width: u32,
  pub height: u32,
}

impl Rect {
  pub fn equal_size(&self, width: u32, height: u32) -> bool {
    self.width == width && self.height == height
  }
}

pub fn crop_bitmap<T: Copy>(bitmap: &[T], width: u32, height: u32, rect: &Rect) -> Vec<T> {
  assert_eq!(
    bitmap.len(),
    (width * height) as usize,
    "bitmap length is not correct"
  );

  assert!(
    rect.x < width
      && rect.y < height
      && rect.x + rect.width <= width
      && rect.y + rect.height <= height,
    "rect is out of range"
  );

  let mut result = Vec::with_capacity((rect.width * rect.height) as usize);

  for y in rect.y..(rect.y + rect.height) {
    let start = (y * width + rect.x) as usize;
    let end = start + rect.width as usize;
    result.extend_from_slice(&bitmap[start..end]);
  }

  result
}

pub fn crop_bitmap_chunked<T: Copy>(
  bitmap: &[T],
  width: u32,
  height: u32,
  chunk_size: u8,
  rect: &Rect,
) -> Vec<T> {
  let chunk_size = chunk_size as u32;

  assert_eq!(
    bitmap.len(),
    (width * height * chunk_size) as usize,
    "bitmap length is not correct"
  );

  assert!(
    rect.x < width
      && rect.y < height
      && rect.x + rect.width <= width
      && rect.y + rect.height <= height,
    "rect is out of range"
  );

  let mut result = Vec::with_capacity((rect.width * rect.height * chunk_size) as usize);

  for y in rect.y..(rect.y + rect.height) {
    let start = ((y * width + rect.x) * chunk_size) as usize;
    let end = start + (rect.width * chunk_size) as usize;
    result.extend_from_slice(&bitmap[start..end]);
  }

  result
}

pub fn find_changed_rect<T: Eq + Debug>(
  buffer_0: &[T],
  buffer_1: &[T],
  width: u32,
  height: u32,
) -> Rect {
  let width = width as usize;
  let height = height as usize;
  let expected_size = width * height;
  assert_eq!(
    buffer_0.len(),
    expected_size,
    "buffer_0 length is not correct"
  );
  assert_eq!(
    buffer_1.len(),
    expected_size,
    "buffer_1 length is not correct"
  );

  let mut top = 0;
  let mut left = 0;
  let mut bottom = 0;
  let mut right = 0;

  // 扫描右侧
  'right: while right < width - left {
    for y in top..(height - bottom) {
      let index = y * width + width - right - 1;

      if buffer_0[index] != buffer_1[index] {
        break 'right;
      }
    }

    right += 1;
  }

  // 扫描下侧
  'bottom: while bottom < height - top {
    for x in left..(width - right) {
      let index = (height - bottom - 1) * width + x;

      if buffer_0[index] != buffer_1[index] {
        break 'bottom;
      }
    }

    bottom += 1;
  }

  // 扫描左侧
  'left: while left < width - right {
    for y in top..(height - bottom) {
      let index = y * width + left;

      if buffer_0[index] != buffer_1[index] {
        break 'left;
      }
    }

    left += 1;
  }

  // 扫描上侧
  'top: while top < height - bottom {
    for x in left..(width - right) {
      let index = top * width + x;

      if buffer_0[index] != buffer_1[index] {
        break 'top;
      }
    }

    top += 1;
  }

  Rect {
    x: left as u32,
    y: top as u32,
    width: (width - left - right) as u32,
    height: (height - top - bottom) as u32,
  }
}

pub fn find_changed_rect_chunked<T: Eq + Debug>(
  buffer_0: &[T],
  buffer_1: &[T],
  width: u32,
  height: u32,
  chunk_size: u8,
) -> Rect {
  let width = width as usize;
  let height = height as usize;
  let chunk_size = chunk_size as usize;
  let expected_size = width * height * chunk_size;
  assert_eq!(
    buffer_0.len(),
    expected_size,
    "buffer_0 length is not correct"
  );
  assert_eq!(
    buffer_1.len(),
    expected_size,
    "buffer_1 length is not correct"
  );

  let mut top = 0;
  let mut left = 0;
  let mut bottom = 0;
  let mut right = 0;

  // 扫描右侧
  'right: while right < width - left {
    for y in top..(height - bottom) {
      let index = y * width + width - right - 1;
      let index = index * chunk_size;

      if buffer_0[index..index + chunk_size] != buffer_1[index..index + chunk_size] {
        break 'right;
      }
    }

    right += 1;
  }

  // 扫描下侧
  'bottom: while bottom < height - top {
    for x in left..(width - right) {
      let index = (height - bottom - 1) * width + x;
      let index = index * chunk_size;

      if buffer_0[index..index + chunk_size] != buffer_1[index..index + chunk_size] {
        break 'bottom;
      }
    }

    bottom += 1;
  }

  // 扫描左侧
  'left: while left < width - right {
    for y in top..(height - bottom) {
      let index = y * width + left;
      let index = index * chunk_size;

      if buffer_0[index..index + chunk_size] != buffer_1[index..index + chunk_size] {
        break 'left;
      }
    }

    left += 1;
  }

  // 扫描上侧
  'top: while top < height - bottom {
    for x in left..(width - right) {
      let index = top * width + x;
      let index = index * chunk_size;

      if buffer_0[index..index + chunk_size] != buffer_1[index..index + chunk_size] {
        break 'top;
      }
    }

    top += 1;
  }

  Rect {
    x: left as u32,
    y: top as u32,
    width: (width - left - right) as u32,
    height: (height - top - bottom) as u32,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_crop_bitmap() {
    #[rustfmt::skip]
    let bitmap = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];

    #[rustfmt::skip]
    let expected_1: [i32; 0] = [];
    assert_eq!(
      crop_bitmap(
        &bitmap,
        3,
        3,
        &Rect {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      ),
      expected_1
    );

    #[rustfmt::skip]
    let expected_2 = [
      0
    ];
    assert_eq!(
      crop_bitmap(
        &bitmap,
        3,
        3,
        &Rect {
          x: 0,
          y: 0,
          width: 1,
          height: 1
        }
      ),
      expected_2
    );

    #[rustfmt::skip]
    let expected_3 = [
      4
    ];
    assert_eq!(
      crop_bitmap(
        &bitmap,
        3,
        3,
        &Rect {
          x: 1,
          y: 1,
          width: 1,
          height: 1
        }
      ),
      expected_3
    );

    #[rustfmt::skip]
    let expected_4 = [
      3, 4, 5,
    ];
    assert_eq!(
      crop_bitmap(
        &bitmap,
        3,
        3,
        &Rect {
          x: 0,
          y: 1,
          width: 3,
          height: 1
        }
      ),
      expected_4
    );

    #[rustfmt::skip]
    let expected_5 = [
      1,
      4,
      7,
    ];
    assert_eq!(
      crop_bitmap(
        &bitmap,
        3,
        3,
        &Rect {
          x: 1,
          y: 0,
          width: 1,
          height: 3
        }
      ),
      expected_5
    );

    #[rustfmt::skip]
    let expected_6 = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      crop_bitmap(
        &bitmap,
        3,
        3,
        &Rect {
          x: 0,
          y: 0,
          width: 3,
          height: 3
        }
      ),
      expected_6
    );
  }

  #[test]
  fn test_crop_bitmap_chunked() {
    #[rustfmt::skip]
    let bitmap = [
      0, 0, 1, 1, 2, 2,
      3, 3, 4, 4, 5, 5,
      6, 6, 7, 7, 8, 8,
    ];

    #[rustfmt::skip]
    let expected_1: [i32; 0] = [];
    assert_eq!(
      crop_bitmap_chunked(
        &bitmap,
        3,
        3,
        2,
        &Rect {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        },
      ),
      expected_1
    );

    #[rustfmt::skip]
    let expected_2 = [
      0, 0
    ];
    assert_eq!(
      crop_bitmap_chunked(
        &bitmap,
        3,
        3,
        2,
        &Rect {
          x: 0,
          y: 0,
          width: 1,
          height: 1
        }
      ),
      expected_2
    );

    #[rustfmt::skip]
    let expected_3 = [
      4, 4
    ];
    assert_eq!(
      crop_bitmap_chunked(
        &bitmap,
        3,
        3,
        2,
        &Rect {
          x: 1,
          y: 1,
          width: 1,
          height: 1
        }
      ),
      expected_3
    );

    #[rustfmt::skip]
    let expected_4 = [
      3, 3, 4, 4, 5, 5,
    ];
    assert_eq!(
      crop_bitmap_chunked(
        &bitmap,
        3,
        3,
        2,
        &Rect {
          x: 0,
          y: 1,
          width: 3,
          height: 1
        }
      ),
      expected_4
    );

    #[rustfmt::skip]
    let expected_5 = [
      1, 1,
      4, 4,
      7, 7,
    ];
    assert_eq!(
      crop_bitmap_chunked(
        &bitmap,
        3,
        3,
        2,
        &Rect {
          x: 1,
          y: 0,
          width: 1,
          height: 3
        }
      ),
      expected_5
    );

    #[rustfmt::skip]
    let expected_6 = [
      0, 0, 1, 1, 2, 2,
      3, 3, 4, 4, 5, 5,
      6, 6, 7, 7, 8, 8,
    ];
    assert_eq!(
      crop_bitmap_chunked(
        &bitmap,
        3,
        3,
        2,
        &Rect {
          x: 0,
          y: 0,
          width: 3,
          height: 3
        }
      ),
      expected_6
    );
  }

  #[test]
  fn test_find_changed_rect() {
    #[rustfmt::skip]
    let buffer_0 = vec![
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];

    #[rustfmt::skip]
    let buffer_1 = vec![
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_1, 3, 3),
      Rect {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    );

    #[rustfmt::skip]
    let buffer_2 = vec![
      1, 1, 2,
      3, 4, 5,
      6, 7, 9,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_2, 3, 3),
      Rect {
        x: 0,
        y: 0,
        width: 3,
        height: 3
      }
    );

    #[rustfmt::skip]
    let buffer_3 = vec![
      1, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_3, 3, 3),
      Rect {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_4 = vec![
      0, 1, 3,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_4, 3, 3),
      Rect {
        x: 2,
        y: 0,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_5 = vec![
      0, 1, 2,
      3, 4, 5,
      0, 7, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_5, 3, 3),
      Rect {
        x: 0,
        y: 2,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_6 = vec![
      0, 1, 2,
      3, 3, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_6, 3, 3),
      Rect {
        x: 1,
        y: 1,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_7 = vec![
      0, 0, 2,
      3, 4, 5,
      6, 0, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_7, 3, 3),
      Rect {
        x: 1,
        y: 0,
        width: 1,
        height: 3
      }
    );

    #[rustfmt::skip]
    let buffer_8 = vec![
      0, 1, 2,
      0, 3, 0,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect(&buffer_0, &buffer_8, 3, 3),
      Rect {
        x: 0,
        y: 1,
        width: 3,
        height: 1
      }
    );
  }

  #[test]
  fn test_find_changed_rect_chunked() {
    #[rustfmt::skip]
    let buffer_0 = vec![
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];

    #[rustfmt::skip]
    let buffer_1 = vec![
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_1, 3, 3, 1),
      Rect {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    );

    #[rustfmt::skip]
    let buffer_2 = vec![
      1, 1, 2,
      3, 4, 5,
      6, 7, 9,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_2, 3, 3, 1),
      Rect {
        x: 0,
        y: 0,
        width: 3,
        height: 3
      }
    );

    #[rustfmt::skip]
    let buffer_3 = vec![
      1, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_3, 3, 3, 1),
      Rect {
        x: 0,
        y: 0,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_4 = vec![
      0, 1, 3,
      3, 4, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_4, 3, 3, 1),
      Rect {
        x: 2,
        y: 0,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_5 = vec![
      0, 1, 2,
      3, 4, 5,
      0, 7, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_5, 3, 3, 1),
      Rect {
        x: 0,
        y: 2,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_6 = vec![
      0, 1, 2,
      3, 3, 5,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_6, 3, 3, 1),
      Rect {
        x: 1,
        y: 1,
        width: 1,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_7 = vec![
      0, 0, 2,
      3, 4, 5,
      6, 0, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_7, 3, 3, 1),
      Rect {
        x: 1,
        y: 0,
        width: 1,
        height: 3
      }
    );

    #[rustfmt::skip]
    let buffer_8 = vec![
      0, 1, 2,
      0, 3, 0,
      6, 7, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(&buffer_0, &buffer_8, 3, 3, 1),
      Rect {
        x: 0,
        y: 1,
        width: 3,
        height: 1
      }
    );

    #[rustfmt::skip]
    let buffer_chunked = [
      0, 0,  1, 1,  2, 2,
      3, 3,  4, 4,  5, 5,
      6, 6,  7, 7,  8, 8,
    ];
    #[rustfmt::skip]
    let buffer_chunked_1 = [
      0, 0,  1, 1,  2, 2,
      3, 3,  4, 4,  6, 5,
      6, 6,  7, 8,  8, 8,
    ];
    assert_eq!(
      find_changed_rect_chunked(
        &buffer_chunked,
        &buffer_chunked_1,
        3,
        3,
        2
      ),
      Rect {
        x: 1,
        y: 1,
        width: 2,
        height: 2
      }
    );
  }
}
