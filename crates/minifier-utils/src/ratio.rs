use num_rational::Ratio;
use num_traits::{CheckedMul, FromPrimitive};

pub trait RatioSafeOps<T> {
  fn safe_mul(&self, rhs: &Self) -> Self;
  fn safe_mul_int(&self, rhs: T) -> Self;
  fn safe_div_int(&self, rhs: T) -> Self;
  fn safe_cast_u64(&self) -> Ratio<u64>;
  fn safe_cast_u32(&self) -> Ratio<u32>;
  fn safe_cast_i32(&self) -> Ratio<i32>;
  fn safe_cast_u16(&self) -> Ratio<u16>;
}

macro_rules! safe_cast_to {
  ($func_name:ident, $t:ty) => {
    fn $func_name(&self) -> Ratio<$t> {
      let n = *self.numer();
      let d = *self.denom();

      #[allow(irrefutable_let_patterns)]
      if let (Ok(numer_t), Ok(denom_t)) = (n.try_into(), d.try_into()) {
        return Ratio::new(numer_t, denom_t);
      }

      let ratio_f = n as f64 / d as f64;
      let ratio: Ratio<$t> = Ratio::from_f64(ratio_f).unwrap_or(Ratio::new(<$t>::MAX, 1));

      ratio.into()
    }
  };
}

macro_rules! impl_safe_ops {
  ($t:ty) => {
    impl RatioSafeOps<$t> for Ratio<$t> {
      fn safe_mul(&self, rhs: &Ratio<$t>) -> Self {
        self.checked_mul(&rhs).unwrap_or_else(|| {
          let n = *self.numer();
          let d = *self.denom();
          let n1 = *rhs.numer();
          let d1 = *rhs.denom();
          Ratio::from_f64(n as f64 / d as f64 * n1 as f64 / d1 as f64)
            .unwrap_or_else(|| Ratio::new(<$t>::MAX, 1))
        })
      }

      fn safe_mul_int(&self, rhs: $t) -> Self {
        self.safe_mul(&Ratio::new(rhs, 1))
      }

      fn safe_div_int(&self, rhs: $t) -> Self {
        self.safe_mul(&Ratio::new(1, rhs))
      }

      safe_cast_to!(safe_cast_u64, u64);

      safe_cast_to!(safe_cast_u32, u32);

      safe_cast_to!(safe_cast_i32, i32);

      safe_cast_to!(safe_cast_u16, u16);
    }
  };
}

// only implement for unsigned types
impl_safe_ops!(u16);
impl_safe_ops!(u32);
impl_safe_ops!(u64);

#[cfg(test)]
mod tests {
  use num_rational::Ratio;

  use crate::RatioSafeOps;

  #[test]
  fn test_ratio_ext_0() {
    // normal value
    let ratio = Ratio::<u64>::new(2, 3);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (2, 3));
    assert_eq!(tuple_u16, (2, 3));
  }

  #[test]
  fn test_ratio_ext_1() {
    // very small value
    let ratio = Ratio::<u64>::new(1, 0xefffffffffffffff);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (0, 1));
    assert_eq!(tuple_u16, (0, 1));
  }

  #[test]
  fn test_ratio_ext_2() {
    let ratio = Ratio::<u64>::new(0xcf00000000000000, 0xef00000000000000);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (0xcf, 0xef));
    assert_eq!(tuple_u16, (0xcf, 0xef));
  }

  #[test]
  fn test_ratio_ext_3() {
    let ratio = Ratio::<u64>::new(0xcffff00000000000, 0xeffff00000000000);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (0xcffff, 0xeffff));
    assert_eq!(tuple_u16, (13, 15));
  }

  #[test]
  fn test_ratio_ext_4() {
    let ratio = Ratio::<u64>::new(0xb8cc661ecfb7356a, 0xa12a1f94e883ea44);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (125063401, 109069031));
    assert_eq!(tuple_u16, (8953, 7808));
  }

  #[test]
  fn test_ratio_ext_5() {
    // very big value: u16 overflow
    let ratio = Ratio::<u64>::new(0xc661e, 1);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (0xc661e, 1));
    assert_eq!(tuple_u16, (0xffff, 1));
  }

  #[test]
  fn test_ratio_ext_6() {
    // very big value: u32 overflow
    let ratio = Ratio::<u64>::new(0xb8cc661ecfb7356a, 1);
    let tuple_u32: (u32, u32) = ratio.safe_cast_u32().into();
    let tuple_u16: (u16, u16) = ratio.safe_cast_u16().into();
    assert_eq!(tuple_u32, (0xffffffff, 1));
    assert_eq!(tuple_u16, (0xffff, 1));
  }
}
