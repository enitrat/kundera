#!/bin/bash
# Kundera build script
set -e

echo "Building Rust FFI..."
cargo build --release

echo "Building Zig..."
zig build

echo "Building TypeScript..."
pnpm build:dist

echo "Build complete!"
