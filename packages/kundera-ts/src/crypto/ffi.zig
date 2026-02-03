//! Starknet Crypto FFI - Extern declarations for Rust C API
//!
//! This module declares the extern functions from libstarknet_crypto_ffi.a

const std = @import("std");

/// Result codes from FFI functions
pub const StarkResult = enum(c_int) {
    success = 0,
    invalid_input = 1,
    invalid_signature = 2,
    recovery_failed = 3,
    division_by_zero = 4,
    no_inverse = 5,
    no_square_root = 6,
};

/// Felt252 as 32 bytes (big-endian)
pub const FeltBytes = [32]u8;

// ============ FELT ARITHMETIC ============

pub extern "C" fn felt_add(a: *const FeltBytes, b: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_sub(a: *const FeltBytes, b: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_mul(a: *const FeltBytes, b: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_div(a: *const FeltBytes, b: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_neg(a: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_inverse(a: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_pow(base: *const FeltBytes, exp: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn felt_sqrt(a: *const FeltBytes, out: *FeltBytes) StarkResult;

// ============ HASHING ============

pub extern "C" fn starknet_pedersen_hash(a: *const FeltBytes, b: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn starknet_poseidon_hash(a: *const FeltBytes, b: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn starknet_poseidon_hash_many(inputs: [*]const FeltBytes, count: usize, out: *FeltBytes) StarkResult;

// ============ ECDSA ============

pub extern "C" fn starknet_get_public_key(private_key: *const FeltBytes, out: *FeltBytes) StarkResult;
pub extern "C" fn starknet_sign(
    private_key: *const FeltBytes,
    message_hash: *const FeltBytes,
    out_r: *FeltBytes,
    out_s: *FeltBytes,
) StarkResult;
pub extern "C" fn starknet_verify(
    public_key: *const FeltBytes,
    message_hash: *const FeltBytes,
    r: *const FeltBytes,
    s: *const FeltBytes,
) StarkResult;
pub extern "C" fn starknet_recover(
    message_hash: *const FeltBytes,
    r: *const FeltBytes,
    s: *const FeltBytes,
    v: *const FeltBytes,
    out: *FeltBytes,
) StarkResult;

// ============ ZIG WRAPPERS ============

pub const FfiError = error{
    InvalidInput,
    InvalidSignature,
    RecoveryFailed,
    DivisionByZero,
    NoInverse,
    NoSquareRoot,
};

fn resultToError(result: StarkResult) FfiError!void {
    return switch (result) {
        .success => {},
        .invalid_input => error.InvalidInput,
        .invalid_signature => error.InvalidSignature,
        .recovery_failed => error.RecoveryFailed,
        .division_by_zero => error.DivisionByZero,
        .no_inverse => error.NoInverse,
        .no_square_root => error.NoSquareRoot,
    };
}

/// Safe wrapper for felt addition
pub fn add(a: FeltBytes, b: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_add(&a, &b, &out));
    return out;
}

/// Safe wrapper for felt subtraction
pub fn sub(a: FeltBytes, b: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_sub(&a, &b, &out));
    return out;
}

/// Safe wrapper for felt multiplication
pub fn mul(a: FeltBytes, b: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_mul(&a, &b, &out));
    return out;
}

/// Safe wrapper for felt division
pub fn div(a: FeltBytes, b: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_div(&a, &b, &out));
    return out;
}

/// Safe wrapper for felt negation
pub fn neg(a: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_neg(&a, &out));
    return out;
}

/// Safe wrapper for multiplicative inverse
pub fn inverse(a: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_inverse(&a, &out));
    return out;
}

/// Safe wrapper for exponentiation
pub fn pow(base: FeltBytes, exp: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_pow(&base, &exp, &out));
    return out;
}

/// Safe wrapper for square root
pub fn sqrt(a: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(felt_sqrt(&a, &out));
    return out;
}

/// Safe wrapper for Pedersen hash
pub fn pedersenHash(a: FeltBytes, b: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(starknet_pedersen_hash(&a, &b, &out));
    return out;
}

/// Safe wrapper for Poseidon hash (2 elements)
pub fn poseidonHash(a: FeltBytes, b: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(starknet_poseidon_hash(&a, &b, &out));
    return out;
}

/// Safe wrapper for Poseidon hash (many elements)
pub fn poseidonHashMany(inputs: []const FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(starknet_poseidon_hash_many(inputs.ptr, inputs.len, &out));
    return out;
}

/// Safe wrapper for public key derivation
pub fn getPublicKey(private_key: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(starknet_get_public_key(&private_key, &out));
    return out;
}

/// Signature (r, s)
pub const Signature = struct {
    r: FeltBytes,
    s: FeltBytes,
};

/// Safe wrapper for signing
pub fn sign(private_key: FeltBytes, message_hash: FeltBytes) FfiError!Signature {
    var sig: Signature = undefined;
    try resultToError(starknet_sign(&private_key, &message_hash, &sig.r, &sig.s));
    return sig;
}

/// Safe wrapper for verification
pub fn verify(public_key: FeltBytes, message_hash: FeltBytes, sig: Signature) FfiError!bool {
    const result = starknet_verify(&public_key, &message_hash, &sig.r, &sig.s);
    return switch (result) {
        .success => true,
        .invalid_signature => false,
        else => {
            try resultToError(result);
            unreachable;
        },
    };
}

/// Safe wrapper for public key recovery
pub fn recover(message_hash: FeltBytes, r: FeltBytes, s: FeltBytes, v: FeltBytes) FfiError!FeltBytes {
    var out: FeltBytes = undefined;
    try resultToError(starknet_recover(&message_hash, &r, &s, &v, &out));
    return out;
}
