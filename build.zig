const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Primitives module - Starknet types (Felt252, ContractAddress, etc.)
    const primitives_mod = b.addModule("primitives", .{
        .root_source_file = b.path("src/primitives/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Crypto module - Pedersen, Poseidon, STARK ECDSA
    const crypto_mod = b.addModule("crypto", .{
        .root_source_file = b.path("src/crypto/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    crypto_mod.addImport("primitives", primitives_mod);

    // Serde module - Cairo serialization
    const serde_mod = b.addModule("serde", .{
        .root_source_file = b.path("src/serde/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    serde_mod.addImport("primitives", primitives_mod);

    // Primitives tests
    const primitives_tests = b.addTest(.{
        .name = "primitives-tests",
        .root_module = primitives_mod,
    });

    // Crypto tests - need to link Rust FFI library
    const crypto_tests = b.addTest(.{
        .name = "crypto-tests",
        .root_module = crypto_mod,
    });
    // Link the Rust static library
    crypto_tests.addObjectFile(b.path("target/release/libstarknet_crypto_ffi.a"));
    // Link system libraries required by Rust
    crypto_tests.linkSystemLibrary("c");

    // Serde tests
    const serde_tests = b.addTest(.{
        .name = "serde-tests",
        .root_module = serde_mod,
    });

    const run_primitives_tests = b.addRunArtifact(primitives_tests);
    const run_crypto_tests = b.addRunArtifact(crypto_tests);
    const run_serde_tests = b.addRunArtifact(serde_tests);

    const test_step = b.step("test", "Run all tests");
    test_step.dependOn(&run_primitives_tests.step);
    test_step.dependOn(&run_crypto_tests.step);
    test_step.dependOn(&run_serde_tests.step);
}
