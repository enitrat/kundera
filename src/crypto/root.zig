//! Starknet Crypto - Cryptographic Operations
//!
//! This module provides Starknet cryptographic primitives:
//! - Pedersen hash
//! - Poseidon hash
//! - STARK curve ECDSA (sign, verify, get_public_key)

const std = @import("std");
const primitives = @import("primitives");

pub const Felt252 = primitives.Felt252;
pub const ffi = @import("ffi.zig");

pub const CryptoError = ffi.FfiError;
pub const Signature = ffi.Signature;

/// Pedersen hash of two felts
pub fn pedersenHash(a: Felt252, b: Felt252) CryptoError!Felt252 {
    const result = try ffi.pedersenHash(a.bytes, b.bytes);
    return Felt252.fromBytes(result);
}

/// Poseidon hash of two felts
pub fn poseidonHash(a: Felt252, b: Felt252) CryptoError!Felt252 {
    const result = try ffi.poseidonHash(a.bytes, b.bytes);
    return Felt252.fromBytes(result);
}

/// Poseidon hash of multiple felts
pub fn poseidonHashMany(inputs: []const Felt252) CryptoError!Felt252 {
    // Convert slice of Felt252 to slice of FeltBytes
    const bytes = @as([*]const ffi.FeltBytes, @ptrCast(inputs.ptr));
    const result = try ffi.poseidonHashMany(bytes[0..inputs.len]);
    return Felt252.fromBytes(result);
}

/// Get public key from private key
pub fn getPublicKey(private_key: Felt252) CryptoError!Felt252 {
    const result = try ffi.getPublicKey(private_key.bytes);
    return Felt252.fromBytes(result);
}

/// Sign a message hash with private key
pub fn sign(private_key: Felt252, message_hash: Felt252) CryptoError!Signature {
    return ffi.sign(private_key.bytes, message_hash.bytes);
}

/// Verify a signature
pub fn verify(public_key: Felt252, message_hash: Felt252, sig: Signature) CryptoError!bool {
    return ffi.verify(public_key.bytes, message_hash.bytes, sig);
}

/// Recover public key from signature
pub fn recover(message_hash: Felt252, r: Felt252, s: Felt252, v: Felt252) CryptoError!Felt252 {
    const result = try ffi.recover(message_hash.bytes, r.bytes, s.bytes, v.bytes);
    return Felt252.fromBytes(result);
}

// ============ TESTS ============

test "pedersen hash non-zero" {
    const a = Felt252.ONE;
    const b = Felt252.ONE;
    const hash = try pedersenHash(a, b);
    // Hash should not be zero for non-trivial inputs
    try std.testing.expect(!hash.eql(Felt252.ZERO));
}

test "poseidon hash non-zero" {
    const a = Felt252.ONE;
    const b = Felt252.ONE;
    const hash = try poseidonHash(a, b);
    // Hash should not be zero for non-trivial inputs
    try std.testing.expect(!hash.eql(Felt252.ZERO));
}

test "poseidon hash many" {
    const inputs = [_]Felt252{ Felt252.ONE, Felt252.ONE, Felt252.ONE };
    const hash = try poseidonHashMany(&inputs);
    try std.testing.expect(!hash.eql(Felt252.ZERO));
}

test "get public key" {
    // Use a simple non-zero private key
    var pk_bytes = [_]u8{0} ** 32;
    pk_bytes[31] = 42;
    const private_key = Felt252.fromBytes(pk_bytes);

    const public_key = try getPublicKey(private_key);
    try std.testing.expect(!public_key.eql(Felt252.ZERO));
}

test "sign and verify roundtrip" {
    // Private key
    var pk_bytes = [_]u8{0} ** 32;
    pk_bytes[31] = 42;
    const private_key = Felt252.fromBytes(pk_bytes);

    // Get public key
    const public_key = try getPublicKey(private_key);

    // Message hash
    var msg_bytes = [_]u8{0} ** 32;
    msg_bytes[31] = 123;
    const message_hash = Felt252.fromBytes(msg_bytes);

    // Sign
    const sig = try sign(private_key, message_hash);

    // Verify
    const valid = try verify(public_key, message_hash, sig);
    try std.testing.expect(valid);
}

test "verify invalid signature" {
    // Private key
    var pk_bytes = [_]u8{0} ** 32;
    pk_bytes[31] = 42;
    const private_key = Felt252.fromBytes(pk_bytes);

    // Get public key
    const public_key = try getPublicKey(private_key);

    // Message hash
    var msg_bytes = [_]u8{0} ** 32;
    msg_bytes[31] = 123;
    const message_hash = Felt252.fromBytes(msg_bytes);

    // Create invalid signature (non-zero but wrong values)
    var invalid_r = [_]u8{0} ** 32;
    invalid_r[31] = 1; // r = 1
    var invalid_s = [_]u8{0} ** 32;
    invalid_s[31] = 1; // s = 1
    const invalid_sig = Signature{
        .r = invalid_r,
        .s = invalid_s,
    };

    // Verify should return false (invalid signature)
    const valid = try verify(public_key, message_hash, invalid_sig);
    try std.testing.expect(!valid);
}
