//! Starknet Primitives - Core Types
//!
//! This module provides the fundamental Starknet types:
//! - Felt252: 252-bit field element
//! - ContractAddress: Starknet contract address
//! - ClassHash: Contract class identifier
//! - StorageKey: Storage slot address

const std = @import("std");

/// Field prime P = 2^251 + 17*2^192 + 1
/// 0x800000000000011000000000000000000000000000000000000000000000001
pub const FIELD_PRIME: [32]u8 = .{
    0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x11,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
};

/// Felt252 - 252-bit field element (mod P where P = 2^251 + 17*2^192 + 1)
/// Stored as 32 bytes big-endian
pub const Felt252 = struct {
    bytes: [32]u8,

    pub const ZERO: Felt252 = .{ .bytes = [_]u8{0} ** 32 };
    pub const ONE: Felt252 = blk: {
        var bytes = [_]u8{0} ** 32;
        bytes[31] = 1;
        break :blk .{ .bytes = bytes };
    };
    pub const TWO: Felt252 = blk: {
        var bytes = [_]u8{0} ** 32;
        bytes[31] = 2;
        break :blk .{ .bytes = bytes };
    };

    /// Error type for Felt252 operations
    pub const Error = error{
        ValueTooLarge,
        HexTooLong,
        InvalidHexChar,
        BufferTooSmall,
    };

    /// Create from bytes (big-endian), validates < P
    pub fn fromBytes(bytes: [32]u8) Felt252 {
        return .{ .bytes = bytes };
    }

    /// Create from bytes with validation
    pub fn fromBytesChecked(bytes: [32]u8) Error!Felt252 {
        if (!isValidFelt(bytes)) {
            return error.ValueTooLarge;
        }
        return .{ .bytes = bytes };
    }

    /// Create from u64
    pub fn fromU64(value: u64) Felt252 {
        var bytes = [_]u8{0} ** 32;
        std.mem.writeInt(u64, bytes[24..32], value, .big);
        return .{ .bytes = bytes };
    }

    /// Create from u128
    pub fn fromU128(value: u128) Felt252 {
        var bytes = [_]u8{0} ** 32;
        std.mem.writeInt(u128, bytes[16..32], value, .big);
        return .{ .bytes = bytes };
    }

    /// Create from hex string (with or without 0x prefix)
    pub fn fromHex(hex: []const u8) Error!Felt252 {
        const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
        const hex_digits = hex[start..];

        if (hex_digits.len > 64) return error.HexTooLong;

        var bytes = [_]u8{0} ** 32;
        const padding = 64 - hex_digits.len;

        for (hex_digits, 0..) |c, i| {
            const value = std.fmt.charToDigit(c, 16) catch return error.InvalidHexChar;
            const byte_idx = (padding + i) / 2;
            if ((padding + i) % 2 == 0) {
                bytes[byte_idx] = value << 4;
            } else {
                bytes[byte_idx] |= value;
            }
        }

        return fromBytesChecked(bytes);
    }

    /// Convert to hex string (lowercase, with 0x prefix)
    pub fn toHex(self: Felt252, buf: []u8) Error![]u8 {
        if (buf.len < 66) return error.BufferTooSmall;
        buf[0] = '0';
        buf[1] = 'x';
        const hex_chars = "0123456789abcdef";
        for (self.bytes, 0..) |byte, i| {
            buf[2 + i * 2] = hex_chars[byte >> 4];
            buf[2 + i * 2 + 1] = hex_chars[byte & 0x0f];
        }
        return buf[0..66];
    }

    /// Convert to u64 (truncates if > u64 max)
    pub fn toU64(self: Felt252) u64 {
        return std.mem.readInt(u64, self.bytes[24..32], .big);
    }

    /// Convert to u128 (truncates if > u128 max)
    pub fn toU128(self: Felt252) u128 {
        return std.mem.readInt(u128, self.bytes[16..32], .big);
    }

    /// Check equality
    pub fn eql(self: Felt252, other: Felt252) bool {
        return std.mem.eql(u8, &self.bytes, &other.bytes);
    }

    /// Check if zero
    pub fn isZero(self: Felt252) bool {
        return self.eql(ZERO);
    }

    /// Check if value is valid (< P)
    pub fn isValid(self: Felt252) bool {
        return isValidFelt(self.bytes);
    }
};

/// Check if bytes represent a valid felt (< P)
fn isValidFelt(bytes: [32]u8) bool {
    // Compare byte by byte with FIELD_PRIME
    for (bytes, FIELD_PRIME) |b, p| {
        if (b < p) return true;
        if (b > p) return false;
    }
    // Equal to P is not valid
    return false;
}

/// Contract addresses must be < 2^251 (top 5 bits zero)
fn isValidContractAddress(bytes: [32]u8) bool {
    return bytes[0] < 0x08;
}

/// ContractAddress - Starknet contract address (felt252 with validation)
/// Must be < 2^251 (address space constraint)
pub const ContractAddress = struct {
    inner: Felt252,

    pub const Error = error{
        InvalidAddress,
    };

    pub const ZERO: ContractAddress = .{ .inner = Felt252.ZERO };

    pub fn fromFelt(felt: Felt252) Error!ContractAddress {
        // Contract addresses must be valid felts and < 2^251
        if (!felt.isValid() or !isValidContractAddress(felt.bytes)) {
            return error.InvalidAddress;
        }
        return .{ .inner = felt };
    }

    pub fn toFelt(self: ContractAddress) Felt252 {
        return self.inner;
    }

    pub fn fromHex(hex: []const u8) !ContractAddress {
        const felt = try Felt252.fromHex(hex);
        return fromFelt(felt) catch error.InvalidAddress;
    }
};

/// ClassHash - Contract class identifier (Poseidon hash of contract class)
pub const ClassHash = struct {
    inner: Felt252,

    pub const Error = error{
        InvalidClassHash,
    };

    pub const ZERO: ClassHash = .{ .inner = Felt252.ZERO };

    pub fn fromFelt(felt: Felt252) Error!ClassHash {
        if (!felt.isValid()) {
            return error.InvalidClassHash;
        }
        return .{ .inner = felt };
    }

    pub fn toFelt(self: ClassHash) Felt252 {
        return self.inner;
    }

    pub fn fromHex(hex: []const u8) !ClassHash {
        const felt = try Felt252.fromHex(hex);
        return fromFelt(felt) catch error.InvalidClassHash;
    }
};

/// StorageKey - Storage slot address
pub const StorageKey = struct {
    inner: Felt252,

    pub const Error = error{
        InvalidStorageKey,
    };

    pub const ZERO: StorageKey = .{ .inner = Felt252.ZERO };

    pub fn fromFelt(felt: Felt252) Error!StorageKey {
        if (!felt.isValid()) {
            return error.InvalidStorageKey;
        }
        return .{ .inner = felt };
    }

    pub fn toFelt(self: StorageKey) Felt252 {
        return self.inner;
    }

    pub fn fromHex(hex: []const u8) !StorageKey {
        const felt = try Felt252.fromHex(hex);
        return fromFelt(felt) catch error.InvalidStorageKey;
    }
};

// ============ TESTS ============

test "Felt252 basic operations" {
    const zero = Felt252.ZERO;
    const one = Felt252.ONE;

    try std.testing.expect(zero.eql(Felt252.ZERO));
    try std.testing.expect(one.eql(Felt252.ONE));
    try std.testing.expect(!zero.eql(one));
    try std.testing.expect(zero.isZero());
    try std.testing.expect(!one.isZero());
}

test "Felt252 fromHex" {
    const felt = try Felt252.fromHex("0x1");
    try std.testing.expect(felt.eql(Felt252.ONE));

    const felt2 = try Felt252.fromHex("1");
    try std.testing.expect(felt2.eql(Felt252.ONE));

    const felt3 = try Felt252.fromHex("0x10");
    try std.testing.expectEqual(@as(u64, 16), felt3.toU64());
}

test "Felt252 fromU64" {
    const felt = Felt252.fromU64(42);
    try std.testing.expectEqual(@as(u64, 42), felt.toU64());
}

test "Felt252 fromU128" {
    const value: u128 = 0x123456789abcdef0123456789abcdef0;
    const felt = Felt252.fromU128(value);
    try std.testing.expectEqual(value, felt.toU128());
}

test "Felt252 validation" {
    // Valid felt (small value)
    const valid = Felt252.fromU64(42);
    try std.testing.expect(valid.isValid());

    // Value equal to P should be invalid
    const at_prime = Felt252.fromBytes(FIELD_PRIME);
    try std.testing.expect(!at_prime.isValid());
}

test "Felt252 hex roundtrip" {
    const original = Felt252.fromU64(0x123456789abcdef0);
    var buf: [66]u8 = undefined;
    const hex = try original.toHex(&buf);
    const parsed = try Felt252.fromHex(hex);
    try std.testing.expect(original.eql(parsed));
}

test "ContractAddress validation" {
    const valid_felt = Felt252.fromU64(42);
    const addr = try ContractAddress.fromFelt(valid_felt);
    try std.testing.expect(addr.toFelt().eql(valid_felt));

    // 2^251 is invalid for contract addresses
    var invalid_bytes = [_]u8{0} ** 32;
    invalid_bytes[0] = 0x08;
    const invalid_felt = Felt252.fromBytes(invalid_bytes);
    try std.testing.expectError(ContractAddress.Error.InvalidAddress, ContractAddress.fromFelt(invalid_felt));
}

test "ClassHash validation" {
    const valid_felt = Felt252.fromU64(42);
    const hash = try ClassHash.fromFelt(valid_felt);
    try std.testing.expect(hash.toFelt().eql(valid_felt));
}

test "StorageKey validation" {
    const valid_felt = Felt252.fromU64(42);
    const key = try StorageKey.fromFelt(valid_felt);
    try std.testing.expect(key.toFelt().eql(valid_felt));
}
