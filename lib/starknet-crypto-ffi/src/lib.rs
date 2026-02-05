//! Starknet Crypto FFI - C ABI wrapper for starknet-crypto
//!
//! Exposes Felt252 arithmetic, Pedersen/Poseidon hashing, and STARK ECDSA
//! as extern "C" functions for Zig FFI consumption.

use starknet_crypto::{
    pedersen_hash, poseidon_hash, poseidon_hash_many,
    sign, verify, get_public_key, recover, Felt,
    rfc6979_generate_k,
};
use sha3::{Keccak256, Digest};

/// Result codes for FFI functions
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StarkResult {
    Success = 0,
    InvalidInput = 1,
    InvalidSignature = 2,
    RecoveryFailed = 3,
    DivisionByZero = 4,
    NoInverse = 5,
    NoSquareRoot = 6,
}

/// Felt252 as 32 bytes (big-endian)
pub type FeltBytes = [u8; 32];

// ============ HELPERS ============

fn felt_from_bytes(bytes: &FeltBytes) -> Option<Felt> {
    // Felt::from_bytes_be returns the felt directly (panics on invalid)
    // We use from_bytes_be_slice which is safer
    Some(Felt::from_bytes_be_slice(bytes))
}

fn felt_to_bytes(felt: &Felt) -> FeltBytes {
    felt.to_bytes_be()
}

// ============ FELT ARITHMETIC ============

/// Add two felts: (a + b) mod P
#[no_mangle]
pub unsafe extern "C" fn felt_add(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let b = match felt_from_bytes(&*b) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    *out = felt_to_bytes(&(a + b));
    StarkResult::Success
}

/// Subtract two felts: (a - b) mod P
#[no_mangle]
pub unsafe extern "C" fn felt_sub(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let b = match felt_from_bytes(&*b) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    *out = felt_to_bytes(&(a - b));
    StarkResult::Success
}

/// Multiply two felts: (a * b) mod P
#[no_mangle]
pub unsafe extern "C" fn felt_mul(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let b = match felt_from_bytes(&*b) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    *out = felt_to_bytes(&(a * b));
    StarkResult::Success
}

/// Divide two felts: a * inverse(b) mod P
#[no_mangle]
pub unsafe extern "C" fn felt_div(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let b = match felt_from_bytes(&*b) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    if b == Felt::ZERO {
        return StarkResult::DivisionByZero;
    }
    // Field division: a * b^(-1)
    let b_inv = b.inverse().unwrap();
    *out = felt_to_bytes(&(a * b_inv));
    StarkResult::Success
}

/// Negate a felt: -a mod P (equivalently P - a)
#[no_mangle]
pub unsafe extern "C" fn felt_neg(
    a: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    *out = felt_to_bytes(&(-a));
    StarkResult::Success
}

/// Multiplicative inverse: a^(-1) mod P
#[no_mangle]
pub unsafe extern "C" fn felt_inverse(
    a: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    match a.inverse() {
        Some(inv) => {
            *out = felt_to_bytes(&inv);
            StarkResult::Success
        }
        None => StarkResult::NoInverse, // Zero has no inverse
    }
}

/// Power: base^exp mod P
#[no_mangle]
pub unsafe extern "C" fn felt_pow(
    base: *const FeltBytes,
    exp: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let base = match felt_from_bytes(&*base) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let exp = match felt_from_bytes(&*exp) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    // Convert exp to u128 for pow (Felt doesn't have pow_felt directly)
    // For large exponents, we use the bits
    let result = felt_pow_impl(base, exp);
    *out = felt_to_bytes(&result);
    StarkResult::Success
}

// Helper for modular exponentiation using square-and-multiply
fn felt_pow_impl(base: Felt, exp: Felt) -> Felt {
    let exp_bytes = exp.to_bytes_be();
    let mut result = Felt::ONE;
    let mut current = base;

    for byte in exp_bytes.iter().rev() {
        for bit in 0..8 {
            if (byte >> bit) & 1 == 1 {
                result = result * current;
            }
            current = current * current;
        }
    }
    result
}

/// Square root (Tonelli-Shanks): returns sqrt if exists
#[no_mangle]
pub unsafe extern "C" fn felt_sqrt(
    a: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    match a.sqrt() {
        Some(root) => {
            *out = felt_to_bytes(&root);
            StarkResult::Success
        }
        None => StarkResult::NoSquareRoot, // Not a quadratic residue
    }
}

// ============ HASHING ============

/// Pedersen hash of two felts
#[no_mangle]
pub unsafe extern "C" fn starknet_pedersen_hash(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let b = match felt_from_bytes(&*b) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };

    let result = pedersen_hash(&a, &b);
    *out = felt_to_bytes(&result);
    StarkResult::Success
}

/// Poseidon hash of two felts
#[no_mangle]
pub unsafe extern "C" fn starknet_poseidon_hash(
    a: *const FeltBytes,
    b: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let a = match felt_from_bytes(&*a) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let b = match felt_from_bytes(&*b) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };

    let result = poseidon_hash(a, b);
    *out = felt_to_bytes(&result);
    StarkResult::Success
}

/// Poseidon hash of N felts
#[no_mangle]
pub unsafe extern "C" fn starknet_poseidon_hash_many(
    inputs: *const FeltBytes,
    count: usize,
    out: *mut FeltBytes,
) -> StarkResult {
    if count == 0 {
        return StarkResult::InvalidInput;
    }

    let slice = std::slice::from_raw_parts(inputs, count);
    let felts: Vec<Felt> = slice
        .iter()
        .filter_map(|b| felt_from_bytes(b))
        .collect();

    if felts.len() != count {
        return StarkResult::InvalidInput;
    }

    let result = poseidon_hash_many(&felts);
    *out = felt_to_bytes(&result);
    StarkResult::Success
}

/// Standard Keccak256 hash of arbitrary data (full 32 bytes)
///
/// Returns the full 256-bit Keccak256 hash without any truncation.
#[no_mangle]
pub unsafe extern "C" fn keccak256(
    data: *const u8,
    len: usize,
    out: *mut [u8; 32],
) -> StarkResult {
    if data.is_null() && len > 0 {
        return StarkResult::InvalidInput;
    }

    let slice = if len > 0 {
        std::slice::from_raw_parts(data, len)
    } else {
        &[]
    };

    let mut hasher = Keccak256::new();
    hasher.update(slice);
    let hash = hasher.finalize();

    (*out).copy_from_slice(&hash);
    StarkResult::Success
}

/// Keccak256 hash of arbitrary data, truncated to 250 bits (Starknet selector format)
///
/// This is used for computing function/event selectors in Starknet.
/// The output is keccak256(data) with the top 6 bits masked to zero.
#[no_mangle]
pub unsafe extern "C" fn starknet_keccak256(
    data: *const u8,
    len: usize,
    out: *mut FeltBytes,
) -> StarkResult {
    if data.is_null() && len > 0 {
        return StarkResult::InvalidInput;
    }

    let slice = if len > 0 {
        std::slice::from_raw_parts(data, len)
    } else {
        &[]
    };

    // Compute keccak256
    let mut hasher = Keccak256::new();
    hasher.update(slice);
    let hash = hasher.finalize();

    // Copy to output, masking to 250 bits
    let mut result = [0u8; 32];
    result.copy_from_slice(&hash);
    // Mask top 6 bits (250 = 256 - 6)
    result[0] &= 0x03; // Keep only bottom 2 bits of first byte

    *out = result;
    StarkResult::Success
}

// ============ ECDSA ============

/// Get public key from private key
#[no_mangle]
pub unsafe extern "C" fn starknet_get_public_key(
    private_key: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let pk = match felt_from_bytes(&*private_key) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };

    let public_key = get_public_key(&pk);
    *out = felt_to_bytes(&public_key);
    StarkResult::Success
}

/// Sign a message hash with private key (returns r, s)
#[no_mangle]
pub unsafe extern "C" fn starknet_sign(
    private_key: *const FeltBytes,
    message_hash: *const FeltBytes,
    out_r: *mut FeltBytes,
    out_s: *mut FeltBytes,
) -> StarkResult {
    let pk = match felt_from_bytes(&*private_key) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let msg = match felt_from_bytes(&*message_hash) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };

    // Derive k deterministically via RFC6979 (unique per message+key pair)
    let k = rfc6979_generate_k(&msg, &pk, None);
    match sign(&pk, &msg, &k) {
        Ok(sig) => {
            *out_r = felt_to_bytes(&sig.r);
            *out_s = felt_to_bytes(&sig.s);
            StarkResult::Success
        }
        Err(_) => StarkResult::InvalidInput,
    }
}

/// Verify a signature
#[no_mangle]
pub unsafe extern "C" fn starknet_verify(
    public_key: *const FeltBytes,
    message_hash: *const FeltBytes,
    r: *const FeltBytes,
    s: *const FeltBytes,
) -> StarkResult {
    let pk = match felt_from_bytes(&*public_key) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let msg = match felt_from_bytes(&*message_hash) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let r = match felt_from_bytes(&*r) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let s = match felt_from_bytes(&*s) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };

    match verify(&pk, &msg, &r, &s) {
        Ok(valid) => {
            if valid {
                StarkResult::Success
            } else {
                StarkResult::InvalidSignature
            }
        }
        Err(_) => StarkResult::InvalidInput,
    }
}

/// Recover public key from signature
#[no_mangle]
pub unsafe extern "C" fn starknet_recover(
    message_hash: *const FeltBytes,
    r: *const FeltBytes,
    s: *const FeltBytes,
    v: *const FeltBytes,
    out: *mut FeltBytes,
) -> StarkResult {
    let msg = match felt_from_bytes(&*message_hash) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let r = match felt_from_bytes(&*r) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let s = match felt_from_bytes(&*s) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };
    let v = match felt_from_bytes(&*v) {
        Some(f) => f,
        None => return StarkResult::InvalidInput,
    };

    match recover(&msg, &r, &s, &v) {
        Ok(public_key) => {
            *out = felt_to_bytes(&public_key);
            StarkResult::Success
        }
        Err(_) => StarkResult::RecoveryFailed,
    }
}

// ============ TESTS ============

#[cfg(test)]
mod tests {
    use super::*;

    // Helper to create felt bytes from a small number
    fn felt_bytes_from_u64(n: u64) -> FeltBytes {
        let mut bytes = [0u8; 32];
        bytes[24..32].copy_from_slice(&n.to_be_bytes());
        bytes
    }
    #[test]
    fn test_felt_add() {
        let a = felt_bytes_from_u64(5);
        let b = felt_bytes_from_u64(7);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_add(&a, &b, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // 5 + 7 = 12
        let expected = felt_bytes_from_u64(12);
        assert_eq!(out, expected);
    }

    #[test]
    fn test_felt_sub() {
        let a = felt_bytes_from_u64(10);
        let b = felt_bytes_from_u64(3);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_sub(&a, &b, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // 10 - 3 = 7
        let expected = felt_bytes_from_u64(7);
        assert_eq!(out, expected);
    }

    #[test]
    fn test_felt_mul() {
        let a = felt_bytes_from_u64(6);
        let b = felt_bytes_from_u64(7);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_mul(&a, &b, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // 6 * 7 = 42
        let expected = felt_bytes_from_u64(42);
        assert_eq!(out, expected);
    }

    #[test]
    fn test_felt_div() {
        let a = felt_bytes_from_u64(42);
        let b = felt_bytes_from_u64(7);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_div(&a, &b, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // 42 / 7 = 6
        let expected = felt_bytes_from_u64(6);
        assert_eq!(out, expected);
    }

    #[test]
    fn test_felt_div_by_zero() {
        let a = felt_bytes_from_u64(42);
        let b = felt_bytes_from_u64(0);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_div(&a, &b, &mut out);
            assert_eq!(result, StarkResult::DivisionByZero);
        }
    }

    #[test]
    fn test_felt_neg() {
        let a = felt_bytes_from_u64(5);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_neg(&a, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // -5 + 5 should equal 0
        let mut sum = [0u8; 32];
        unsafe {
            felt_add(&out, &a, &mut sum);
        }
        assert_eq!(sum, felt_bytes_from_u64(0));
    }

    #[test]
    fn test_felt_inverse() {
        let a = felt_bytes_from_u64(7);
        let mut inv = [0u8; 32];

        unsafe {
            let result = felt_inverse(&a, &mut inv);
            assert_eq!(result, StarkResult::Success);
        }

        // a * inv(a) = 1
        let mut product = [0u8; 32];
        unsafe {
            felt_mul(&a, &inv, &mut product);
        }
        assert_eq!(product, felt_bytes_from_u64(1));
    }

    #[test]
    fn test_felt_inverse_zero() {
        let a = felt_bytes_from_u64(0);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_inverse(&a, &mut out);
            assert_eq!(result, StarkResult::NoInverse);
        }
    }

    #[test]
    fn test_felt_pow() {
        let base = felt_bytes_from_u64(2);
        let exp = felt_bytes_from_u64(10);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_pow(&base, &exp, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // 2^10 = 1024
        let expected = felt_bytes_from_u64(1024);
        assert_eq!(out, expected);
    }

    #[test]
    fn test_felt_sqrt() {
        // 9 is a perfect square
        let a = felt_bytes_from_u64(9);
        let mut out = [0u8; 32];

        unsafe {
            let result = felt_sqrt(&a, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Verify: sqrt(9)^2 = 9
        let mut squared = [0u8; 32];
        unsafe {
            felt_mul(&out, &out, &mut squared);
        }
        assert_eq!(squared, a);
    }

    #[test]
    fn test_pedersen_hash() {
        let a = felt_bytes_from_u64(1);
        let b = felt_bytes_from_u64(2);
        let mut out = [0u8; 32];

        unsafe {
            let result = starknet_pedersen_hash(&a, &b, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Just verify it produces a non-zero hash
        assert_ne!(out, [0u8; 32]);
    }

    #[test]
    fn test_poseidon_hash() {
        let a = felt_bytes_from_u64(1);
        let b = felt_bytes_from_u64(2);
        let mut out = [0u8; 32];

        unsafe {
            let result = starknet_poseidon_hash(&a, &b, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Just verify it produces a non-zero hash
        assert_ne!(out, [0u8; 32]);
    }

    #[test]
    fn test_poseidon_hash_many() {
        let inputs = [
            felt_bytes_from_u64(1),
            felt_bytes_from_u64(2),
            felt_bytes_from_u64(3),
        ];
        let mut out = [0u8; 32];

        unsafe {
            let result = starknet_poseidon_hash_many(inputs.as_ptr(), 3, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Just verify it produces a non-zero hash
        assert_ne!(out, [0u8; 32]);
    }

    #[test]
    fn test_get_public_key() {
        // Use a test private key
        let private_key = felt_bytes_from_u64(12345);
        let mut public_key = [0u8; 32];

        unsafe {
            let result = starknet_get_public_key(&private_key, &mut public_key);
            assert_eq!(result, StarkResult::Success);
        }

        // Public key should be non-zero
        assert_ne!(public_key, [0u8; 32]);
    }

    #[test]
    fn test_sign_and_verify_roundtrip() {
        // Generate a test keypair
        let private_key = felt_bytes_from_u64(12345);
        let mut public_key = [0u8; 32];

        unsafe {
            starknet_get_public_key(&private_key, &mut public_key);
        }

        // Message to sign
        let message = felt_bytes_from_u64(0xDEADBEEF);

        // Sign
        let mut r = [0u8; 32];
        let mut s = [0u8; 32];

        unsafe {
            let sign_result = starknet_sign(&private_key, &message, &mut r, &mut s);
            assert_eq!(sign_result, StarkResult::Success);
        }

        // Verify
        unsafe {
            let verify_result = starknet_verify(&public_key, &message, &r, &s);
            assert_eq!(verify_result, StarkResult::Success);
        }
    }

    #[test]
    fn test_verify_invalid_signature() {
        let private_key = felt_bytes_from_u64(12345);
        let mut public_key = [0u8; 32];

        unsafe {
            starknet_get_public_key(&private_key, &mut public_key);
        }

        let message = felt_bytes_from_u64(0xDEADBEEF);

        // Create invalid signature
        let r = felt_bytes_from_u64(1);
        let s = felt_bytes_from_u64(1);

        unsafe {
            let verify_result = starknet_verify(&public_key, &message, &r, &s);
            assert_eq!(verify_result, StarkResult::InvalidSignature);
        }
    }

    #[test]
    fn test_keccak256_standard() {
        let data = b"hello";
        let mut out = [0u8; 32];

        unsafe {
            let result = keccak256(data.as_ptr(), data.len(), &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Known test vector: keccak256("hello")
        // = 0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
        let expected = [
            0x1c, 0x8a, 0xff, 0x95, 0x06, 0x85, 0xc2, 0xed,
            0x4b, 0xc3, 0x17, 0x4f, 0x34, 0x72, 0x28, 0x7b,
            0x56, 0xd9, 0x51, 0x7b, 0x9c, 0x94, 0x81, 0x27,
            0x31, 0x9a, 0x09, 0xa7, 0xa3, 0x6d, 0xea, 0xc8,
        ];
        assert_eq!(out, expected);
    }

    #[test]
    fn test_keccak256_empty() {
        let mut out = [0u8; 32];

        unsafe {
            let result = keccak256(std::ptr::null(), 0, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Known test vector: keccak256("")
        // = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
        let expected = [
            0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c,
            0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0,
            0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
            0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
        ];
        assert_eq!(out, expected);
    }

    #[test]
    fn test_starknet_keccak256() {
        let data = b"transfer";
        let mut out = [0u8; 32];

        unsafe {
            let result = starknet_keccak256(data.as_ptr(), data.len(), &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Result should be < 2^250 (top 6 bits masked)
        assert!(out[0] <= 0x03);

        // Verify it's non-zero
        assert_ne!(out, [0u8; 32]);
    }

    #[test]
    fn test_starknet_keccak256_empty() {
        let mut out = [0u8; 32];

        unsafe {
            let result = starknet_keccak256(std::ptr::null(), 0, &mut out);
            assert_eq!(result, StarkResult::Success);
        }

        // Should produce the keccak of empty string, masked
        assert!(out[0] <= 0x03);
    }
}
