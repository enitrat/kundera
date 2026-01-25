//! Starknet Serde - Cairo Serialization
//!
//! This module provides Cairo-compatible serialization:
//! - Felt array encoding
//! - Struct serialization
//! - Array/span serialization
//! - ByteArray encoding
//! - U256 split encoding

const std = @import("std");
const primitives = @import("primitives");

pub const Felt252 = primitives.Felt252;

/// Serialize a single felt to a buffer
pub fn serializeFelt(felt: Felt252, out: *[1]Felt252) void {
    out[0] = felt;
}

/// Serialize a u256 as two felts [low, high] (Cairo u256 representation)
pub fn serializeU256(value: u256, out: *[2]Felt252) void {
    const low: u128 = @truncate(value);
    const high: u128 = @truncate(value >> 128);

    out[0] = Felt252.fromU128(low);
    out[1] = Felt252.fromU128(high);
}

/// Deserialize two felts [low, high] to u256
pub fn deserializeU256(felts: [2]Felt252) u256 {
    const low = felts[0].toU128();
    const high = felts[1].toU128();
    return (@as(u256, high) << 128) | low;
}

/// Serialize an array of felts with length prefix (Cairo Array<felt252>)
/// Returns: [length, elem0, elem1, ..., elemN-1]
pub fn serializeArray(allocator: std.mem.Allocator, items: []const Felt252) ![]Felt252 {
    const result = try allocator.alloc(Felt252, items.len + 1);
    result[0] = Felt252.fromU64(items.len);
    @memcpy(result[1..], items);
    return result;
}

/// Get the length from a serialized array
pub fn deserializeArrayLength(data: []const Felt252) !usize {
    if (data.len == 0) return error.EmptyData;
    return data[0].toU64();
}

/// Deserialize an array (skip length prefix, return items)
pub fn deserializeArray(data: []const Felt252) ![]const Felt252 {
    if (data.len == 0) return error.EmptyData;
    const len = data[0].toU64();
    if (data.len < len + 1) return error.InsufficientData;
    return data[1 .. len + 1];
}

/// Cairo ByteArray serialization
/// Format: [num_full_words, word0, word1, ..., pending_word, pending_word_len]
pub const ByteArray = struct {
    data: []const u8,

    const BYTES_PER_WORD: usize = 31;

    /// Serialize a byte array to felts
    pub fn serialize(self: ByteArray, allocator: std.mem.Allocator) ![]Felt252 {
        const num_full_words = self.data.len / BYTES_PER_WORD;
        const pending_len = self.data.len % BYTES_PER_WORD;
        const has_pending = pending_len > 0;

        // Output: [num_full_words, word0..wordN, pending_word, pending_word_len]
        const out_len = 1 + num_full_words + (if (has_pending) @as(usize, 2) else @as(usize, 2));
        var result = try allocator.alloc(Felt252, out_len);

        // Number of full 31-byte words
        result[0] = Felt252.fromU64(num_full_words);

        // Full words (31 bytes each, left-padded to 32 bytes)
        for (0..num_full_words) |i| {
            var word_bytes = [_]u8{0} ** 32;
            @memcpy(word_bytes[1..32], self.data[i * BYTES_PER_WORD ..][0..BYTES_PER_WORD]);
            result[1 + i] = Felt252.fromBytes(word_bytes);
        }

        // Pending word (remaining bytes, left-padded)
        var pending_bytes = [_]u8{0} ** 32;
        if (has_pending) {
            const start = 32 - pending_len;
            @memcpy(pending_bytes[start..32], self.data[num_full_words * BYTES_PER_WORD ..]);
        }
        result[1 + num_full_words] = Felt252.fromBytes(pending_bytes);

        // Pending word length
        result[1 + num_full_words + 1] = Felt252.fromU64(pending_len);

        return result;
    }

    /// Deserialize felts back to a byte array
    pub fn deserialize(allocator: std.mem.Allocator, felts: []const Felt252) ![]u8 {
        if (felts.len < 3) return error.InsufficientData;

        const num_full_words = felts[0].toU64();
        if (felts.len < num_full_words + 3) return error.InsufficientData;

        const pending_word = felts[1 + num_full_words];
        const pending_len = felts[1 + num_full_words + 1].toU64();

        const total_len = num_full_words * BYTES_PER_WORD + pending_len;
        var result = try allocator.alloc(u8, total_len);

        // Copy full words
        for (0..num_full_words) |i| {
            @memcpy(result[i * BYTES_PER_WORD ..][0..BYTES_PER_WORD], felts[1 + i].bytes[1..32]);
        }

        // Copy pending bytes
        if (pending_len > 0) {
            const start = 32 - pending_len;
            @memcpy(result[num_full_words * BYTES_PER_WORD ..][0..pending_len], pending_word.bytes[start..32]);
        }

        return result;
    }
};

/// Serialize a bool as a felt (0 or 1)
pub fn serializeBool(value: bool) Felt252 {
    return if (value) Felt252.ONE else Felt252.ZERO;
}

/// Deserialize a felt to a bool
pub fn deserializeBool(felt: Felt252) bool {
    return !felt.isZero();
}

/// Serialize an Option<T> as [is_some, value?]
/// If Some: [1, value], if None: [0]
pub fn serializeOption(allocator: std.mem.Allocator, value: ?Felt252) ![]Felt252 {
    if (value) |v| {
        var result = try allocator.alloc(Felt252, 2);
        result[0] = Felt252.ONE;
        result[1] = v;
        return result;
    } else {
        var result = try allocator.alloc(Felt252, 1);
        result[0] = Felt252.ZERO;
        return result;
    }
}

/// Deserialize an Option<Felt252>
pub fn deserializeOption(data: []const Felt252) !?Felt252 {
    if (data.len == 0) return error.EmptyData;
    if (data[0].isZero()) {
        return null;
    } else {
        if (data.len < 2) return error.InsufficientData;
        return data[1];
    }
}

// ============ TESTS ============

test "u256 serialization roundtrip" {
    const value: u256 = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0;
    var felts: [2]Felt252 = undefined;
    serializeU256(value, &felts);
    const result = deserializeU256(felts);
    try std.testing.expectEqual(value, result);
}

test "u256 serialization small value" {
    const value: u256 = 42;
    var felts: [2]Felt252 = undefined;
    serializeU256(value, &felts);

    // Low should be 42, high should be 0
    try std.testing.expectEqual(@as(u64, 42), felts[0].toU64());
    try std.testing.expect(felts[1].isZero());

    const result = deserializeU256(felts);
    try std.testing.expectEqual(value, result);
}

test "array serialization" {
    const allocator = std.testing.allocator;
    const items = [_]Felt252{ Felt252.ONE, Felt252.TWO, Felt252.fromU64(3) };

    const serialized = try serializeArray(allocator, &items);
    defer allocator.free(serialized);

    // First element should be length
    try std.testing.expectEqual(@as(u64, 3), serialized[0].toU64());

    // Deserialize and check
    const deserialized = try deserializeArray(serialized);
    try std.testing.expectEqual(@as(usize, 3), deserialized.len);
    try std.testing.expect(deserialized[0].eql(Felt252.ONE));
}

test "bool serialization" {
    try std.testing.expect(serializeBool(true).eql(Felt252.ONE));
    try std.testing.expect(serializeBool(false).eql(Felt252.ZERO));
    try std.testing.expect(deserializeBool(Felt252.ONE));
    try std.testing.expect(!deserializeBool(Felt252.ZERO));
}

test "option serialization some" {
    const allocator = std.testing.allocator;
    const value = Felt252.fromU64(42);

    const serialized = try serializeOption(allocator, value);
    defer allocator.free(serialized);

    try std.testing.expectEqual(@as(usize, 2), serialized.len);
    try std.testing.expect(serialized[0].eql(Felt252.ONE));
    try std.testing.expect(serialized[1].eql(value));

    const result = try deserializeOption(serialized);
    try std.testing.expect(result != null);
    try std.testing.expect(result.?.eql(value));
}

test "option serialization none" {
    const allocator = std.testing.allocator;

    const serialized = try serializeOption(allocator, null);
    defer allocator.free(serialized);

    try std.testing.expectEqual(@as(usize, 1), serialized.len);
    try std.testing.expect(serialized[0].isZero());

    const result = try deserializeOption(serialized);
    try std.testing.expect(result == null);
}

test "ByteArray short string" {
    const allocator = std.testing.allocator;
    const data = "Hello";
    const ba = ByteArray{ .data = data };

    const serialized = try ba.serialize(allocator);
    defer allocator.free(serialized);

    // num_full_words should be 0 for short string
    try std.testing.expectEqual(@as(u64, 0), serialized[0].toU64());
    // pending_word_len should be 5
    try std.testing.expectEqual(@as(u64, 5), serialized[2].toU64());

    const deserialized = try ByteArray.deserialize(allocator, serialized);
    defer allocator.free(deserialized);

    try std.testing.expectEqualStrings(data, deserialized);
}
