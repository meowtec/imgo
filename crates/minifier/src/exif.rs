const JPEG_EXIF_PREFIX: &[u8] = b"Exif\0\0";

const TAG_IMAGE_WIDTH: u16 = 0x0100;
const TAG_IMAGE_LENGTH: u16 = 0x0101;
const TAG_ORIENTATION: u16 = 0x0112;
const TAG_EXIF_IFD_POINTER: u16 = 0x8769;
const TAG_PIXEL_X_DIMENSION: u16 = 0xa002;
const TAG_PIXEL_Y_DIMENSION: u16 = 0xa003;

const TYPE_SHORT: u16 = 3;
const TYPE_LONG: u16 = 4;

#[derive(Clone, Copy)]
enum Endian {
  Little,
  Big,
}

pub fn normalize_payload(exif: &[u8]) -> Option<Vec<u8>> {
  if exif.starts_with(JPEG_EXIF_PREFIX) {
    return Some(exif[JPEG_EXIF_PREFIX.len()..].to_vec());
  }

  if is_tiff_payload(exif) {
    return Some(exif.to_vec());
  }

  // libheif exposes Exif metadata with a 4-byte TIFF header offset prefix.
  if exif.len() >= 4 && is_tiff_payload(&exif[4..]) {
    return Some(exif[4..].to_vec());
  }

  None
}

pub fn extract_jpeg_payload(buffer: &[u8]) -> Option<Vec<u8>> {
  if buffer.get(..2) != Some(&[0xff, 0xd8]) {
    return None;
  }

  let mut offset = 2;

  while offset + 4 <= buffer.len() {
    while buffer.get(offset) == Some(&0xff) {
      offset += 1;
    }

    let marker = *buffer.get(offset)?;
    offset += 1;

    if marker == 0xda || marker == 0xd9 {
      return None;
    }

    if (0xd0..=0xd7).contains(&marker) || marker == 0x01 {
      continue;
    }

    let len = u16::from_be_bytes(buffer.get(offset..offset + 2)?.try_into().ok()?) as usize;
    if len < 2 {
      return None;
    }

    let data_offset = offset + 2;
    let data_len = len - 2;
    let data_end = data_offset.checked_add(data_len)?;
    let data = buffer.get(data_offset..data_end)?;

    if marker == 0xe1 {
      if let Some(exif) = normalize_payload(data) {
        return Some(exif);
      }
    }

    offset = data_end;
  }

  None
}

pub fn extract_webp_payload(buffer: &[u8]) -> Option<Vec<u8>> {
  if buffer.get(..4) != Some(b"RIFF") || buffer.get(8..12) != Some(b"WEBP") {
    return None;
  }

  let mut offset = 12;

  while offset + 8 <= buffer.len() {
    let chunk_type = buffer.get(offset..offset + 4)?;
    let chunk_len =
      u32::from_le_bytes(buffer.get(offset + 4..offset + 8)?.try_into().ok()?) as usize;
    let data_offset = offset + 8;
    let data_end = data_offset.checked_add(chunk_len)?;
    let data = buffer.get(data_offset..data_end)?;

    if chunk_type == b"EXIF" {
      return normalize_payload(data);
    }

    offset = data_end + chunk_len % 2;
  }

  None
}

pub fn patched_payload(exif: &[u8], width: u32, height: u32) -> Option<Vec<u8>> {
  let mut exif = normalize_payload(exif)?;
  patch_tiff_payload(&mut exif, width, height);
  Some(exif)
}

pub fn jpeg_app1_payload(exif: &[u8], width: u32, height: u32) -> Option<Vec<u8>> {
  let payload = patched_payload(exif, width, height)?;
  let len = JPEG_EXIF_PREFIX.len() + payload.len();

  if len > u16::MAX as usize - 2 {
    return None;
  }

  let mut app1 = Vec::with_capacity(len);
  app1.extend_from_slice(JPEG_EXIF_PREFIX);
  app1.extend_from_slice(&payload);
  Some(app1)
}

fn is_tiff_payload(exif: &[u8]) -> bool {
  parse_header(exif).is_some()
}

fn parse_header(exif: &[u8]) -> Option<(Endian, usize)> {
  if exif.len() < 8 {
    return None;
  }

  let endian = match &exif[..2] {
    b"II" => Endian::Little,
    b"MM" => Endian::Big,
    _ => return None,
  };

  if read_u16(exif, 2, endian)? != 42 {
    return None;
  }

  Some((
    endian,
    read_u32(exif, 4, endian)? as usize,
  ))
}

fn patch_tiff_payload(exif: &mut [u8], width: u32, height: u32) {
  let Some((endian, ifd_offset)) = parse_header(exif) else {
    return;
  };

  let exif_ifd_offset = patch_ifd(
    exif, ifd_offset, endian, width, height, false,
  );

  if let Some(exif_ifd_offset) = exif_ifd_offset {
    patch_ifd(
      exif,
      exif_ifd_offset,
      endian,
      width,
      height,
      true,
    );
  }
}

fn patch_ifd(
  exif: &mut [u8],
  ifd_offset: usize,
  endian: Endian,
  width: u32,
  height: u32,
  is_exif_ifd: bool,
) -> Option<usize> {
  let entry_count = read_u16(exif, ifd_offset, endian)? as usize;
  let entries_offset = ifd_offset.checked_add(2)?;
  let entries_len = entry_count.checked_mul(12)?;
  entries_offset.checked_add(entries_len)?;

  let mut exif_ifd_offset = None;

  for entry_index in 0..entry_count {
    let entry_offset = entries_offset + entry_index * 12;

    if entry_offset
      .checked_add(12)
      .is_none_or(|end| end > exif.len())
    {
      break;
    }

    let tag = read_u16(exif, entry_offset, endian)?;
    let field_type = read_u16(exif, entry_offset + 2, endian)?;
    let count = read_u32(exif, entry_offset + 4, endian)?;
    let value_offset = entry_offset + 8;

    match tag {
      TAG_ORIENTATION if !is_exif_ifd => {
        write_inline_numeric(
          exif,
          value_offset,
          endian,
          field_type,
          count,
          1,
        );
      }
      TAG_IMAGE_WIDTH if !is_exif_ifd => {
        write_inline_numeric(
          exif,
          value_offset,
          endian,
          field_type,
          count,
          width,
        );
      }
      TAG_IMAGE_LENGTH if !is_exif_ifd => {
        write_inline_numeric(
          exif,
          value_offset,
          endian,
          field_type,
          count,
          height,
        );
      }
      TAG_EXIF_IFD_POINTER if !is_exif_ifd && field_type == TYPE_LONG && count == 1 => {
        exif_ifd_offset = Some(read_u32(exif, value_offset, endian)? as usize);
      }
      TAG_PIXEL_X_DIMENSION if is_exif_ifd => {
        write_inline_numeric(
          exif,
          value_offset,
          endian,
          field_type,
          count,
          width,
        );
      }
      TAG_PIXEL_Y_DIMENSION if is_exif_ifd => {
        write_inline_numeric(
          exif,
          value_offset,
          endian,
          field_type,
          count,
          height,
        );
      }
      _ => {}
    }
  }

  exif_ifd_offset
}

fn write_inline_numeric(
  exif: &mut [u8],
  value_offset: usize,
  endian: Endian,
  field_type: u16,
  count: u32,
  value: u32,
) {
  if count != 1 {
    return;
  }

  match field_type {
    TYPE_SHORT if value <= u16::MAX as u32 => {
      write_u16(exif, value_offset, endian, value as u16);
    }
    TYPE_LONG => {
      write_u32(exif, value_offset, endian, value);
    }
    _ => {}
  }
}

fn read_u16(buffer: &[u8], offset: usize, endian: Endian) -> Option<u16> {
  let bytes: [u8; 2] = buffer.get(offset..offset + 2)?.try_into().ok()?;

  Some(match endian {
    Endian::Little => u16::from_le_bytes(bytes),
    Endian::Big => u16::from_be_bytes(bytes),
  })
}

fn read_u32(buffer: &[u8], offset: usize, endian: Endian) -> Option<u32> {
  let bytes: [u8; 4] = buffer.get(offset..offset + 4)?.try_into().ok()?;

  Some(match endian {
    Endian::Little => u32::from_le_bytes(bytes),
    Endian::Big => u32::from_be_bytes(bytes),
  })
}

fn write_u16(buffer: &mut [u8], offset: usize, endian: Endian, value: u16) {
  let Some(slice) = buffer.get_mut(offset..offset + 2) else {
    return;
  };

  slice.copy_from_slice(&match endian {
    Endian::Little => value.to_le_bytes(),
    Endian::Big => value.to_be_bytes(),
  });
}

fn write_u32(buffer: &mut [u8], offset: usize, endian: Endian, value: u32) {
  let Some(slice) = buffer.get_mut(offset..offset + 4) else {
    return;
  };

  slice.copy_from_slice(&match endian {
    Endian::Little => value.to_le_bytes(),
    Endian::Big => value.to_be_bytes(),
  });
}

#[cfg(test)]
mod tests {
  use super::{jpeg_app1_payload, patched_payload, JPEG_EXIF_PREFIX};

  #[test]
  fn patches_little_endian_tiff_fields() {
    let exif = vec![
      b'I', b'I', 42, 0, 8, 0, 0, 0, 4, 0, 0x00, 0x01, 4, 0, 1, 0, 0, 0, 10, 0, 0, 0, 0x01, 0x01,
      4, 0, 1, 0, 0, 0, 20, 0, 0, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0x69, 0x87, 4, 0, 1,
      0, 0, 0, 62, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0x02, 0xa0, 4, 0, 1, 0, 0, 0, 10, 0, 0, 0, 0x03,
      0xa0, 4, 0, 1, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0,
    ];

    let patched = patched_payload(&exif, 300, 200).unwrap();

    assert_eq!(&patched[18..22], &300u32.to_le_bytes());
    assert_eq!(&patched[30..34], &200u32.to_le_bytes());
    assert_eq!(&patched[42..44], &1u16.to_le_bytes());
    assert_eq!(&patched[72..76], &300u32.to_le_bytes());
    assert_eq!(&patched[84..88], &200u32.to_le_bytes());
  }

  #[test]
  fn strips_container_prefixes_and_builds_jpeg_app1() {
    let mut exif = JPEG_EXIF_PREFIX.to_vec();
    exif.extend_from_slice(&[b'M', b'M', 0, 42, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0]);

    let app1 = jpeg_app1_payload(&exif, 1, 1).unwrap();

    assert!(app1.starts_with(JPEG_EXIF_PREFIX));
    assert_eq!(
      &app1[JPEG_EXIF_PREFIX.len()..JPEG_EXIF_PREFIX.len() + 4],
      b"MM\0*"
    );
  }
}
