use image::Delay;
use num_rational::Ratio;

use crate::ratio::RatioSafeOps;

pub trait DelayExt {
  fn zero() -> Self;
  fn ratio_seconds(&self) -> Ratio<u32>;
  fn from_numer_denom_u64(numer: u64, denom: u64) -> Self;
  fn to_u64_base(&self, base: u64) -> u64;
  fn nanoseconds(&self) -> u64;
}

impl DelayExt for Delay {
  fn zero() -> Self {
    Delay::from_numer_denom_ms(0, 1)
  }

  fn from_numer_denom_u64(numer: u64, denom: u64) -> Self {
    let ratio = Ratio::new(numer, denom).safe_mul_int(1000).safe_cast_u32();
    Delay::from_numer_denom_ms(*ratio.numer(), *ratio.denom())
  }

  fn ratio_seconds(&self) -> Ratio<u32> {
    let (numer, denom) = self.numer_denom_ms();
    Ratio::new(numer, denom).safe_div_int(1000)
  }

  fn to_u64_base(&self, base: u64) -> u64 {
    self
      .ratio_seconds()
      .safe_cast_u64()
      .safe_mul_int(base)
      .to_integer()
  }

  fn nanoseconds(&self) -> u64 {
    // 1s = 1_000_000_000ns
    self.to_u64_base(1_000_000_000)
  }
}

#[cfg(test)]
mod tests {
  use super::DelayExt;
  use image::Delay;

  #[test]
  fn test_big_base() {
    let delay = Delay::from_numer_denom_u64(0xffffffffffffffff, 3);
    assert_eq!(
      delay.to_u64_base(0xffffffffffffffff),
      u64::MAX
    );
  }

  #[test]
  fn test_nanoseconds() {
    let delay = Delay::from_numer_denom_u64(2, 3);
    assert_eq!(delay.nanoseconds(), 666_666_666);
  }
}
