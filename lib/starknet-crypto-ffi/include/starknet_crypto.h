#ifndef STARKNET_CRYPTO_H
#define STARKNET_CRYPTO_H

#include <stdint.h>
#include <stddef.h>

/**
 * Result codes for FFI functions
 */
typedef enum {
    STARK_SUCCESS = 0,
    STARK_INVALID_INPUT = 1,
    STARK_INVALID_SIGNATURE = 2,
    STARK_RECOVERY_FAILED = 3,
    STARK_DIVISION_BY_ZERO = 4,
    STARK_NO_INVERSE = 5,
    STARK_NO_SQUARE_ROOT = 6,
} StarkResult;

/**
 * Felt252 as 32 bytes (big-endian)
 * Field prime P = 2^251 + 17*2^192 + 1
 */
typedef uint8_t FeltBytes[32];

/* ============ FELT ARITHMETIC ============ */

/**
 * Add two felts: (a + b) mod P
 */
StarkResult felt_add(const FeltBytes* a, const FeltBytes* b, FeltBytes* out);

/**
 * Subtract two felts: (a - b) mod P
 */
StarkResult felt_sub(const FeltBytes* a, const FeltBytes* b, FeltBytes* out);

/**
 * Multiply two felts: (a * b) mod P
 */
StarkResult felt_mul(const FeltBytes* a, const FeltBytes* b, FeltBytes* out);

/**
 * Divide two felts: a * inverse(b) mod P
 * Returns STARK_DIVISION_BY_ZERO if b == 0
 */
StarkResult felt_div(const FeltBytes* a, const FeltBytes* b, FeltBytes* out);

/**
 * Negate a felt: -a mod P (equivalently P - a)
 */
StarkResult felt_neg(const FeltBytes* a, FeltBytes* out);

/**
 * Multiplicative inverse: a^(-1) mod P
 * Returns STARK_NO_INVERSE if a == 0
 */
StarkResult felt_inverse(const FeltBytes* a, FeltBytes* out);

/**
 * Power: base^exp mod P
 */
StarkResult felt_pow(const FeltBytes* base, const FeltBytes* exp, FeltBytes* out);

/**
 * Square root (Tonelli-Shanks): returns sqrt if exists
 * Returns STARK_NO_SQUARE_ROOT if a is not a quadratic residue
 */
StarkResult felt_sqrt(const FeltBytes* a, FeltBytes* out);

/* ============ HASHING ============ */

/**
 * Pedersen hash of two felts
 * Used for address computation and storage keys
 */
StarkResult starknet_pedersen_hash(
    const FeltBytes* a,
    const FeltBytes* b,
    FeltBytes* out
);

/**
 * Poseidon hash of two felts
 * ZK-optimized hash, used for transaction hashes (v3+)
 */
StarkResult starknet_poseidon_hash(
    const FeltBytes* a,
    const FeltBytes* b,
    FeltBytes* out
);

/**
 * Poseidon hash of N felts
 */
StarkResult starknet_poseidon_hash_many(
    const FeltBytes* inputs,
    size_t count,
    FeltBytes* out
);

/**
 * Keccak256 hash of arbitrary data, truncated to 250 bits (Starknet selector format)
 * The output is keccak256(data) with the top 6 bits masked to zero.
 */
StarkResult starknet_keccak256(
    const uint8_t* data,
    size_t len,
    FeltBytes* out
);

/* ============ ECDSA (STARK Curve) ============ */

/**
 * Get public key (x-coordinate) from private key
 */
StarkResult starknet_get_public_key(
    const FeltBytes* private_key,
    FeltBytes* out
);

/**
 * Sign a message hash with private key
 * Returns signature (r, s)
 */
StarkResult starknet_sign(
    const FeltBytes* private_key,
    const FeltBytes* message_hash,
    FeltBytes* out_r,
    FeltBytes* out_s
);

/**
 * Verify a signature
 * Returns STARK_SUCCESS if valid, STARK_INVALID_SIGNATURE if not
 */
StarkResult starknet_verify(
    const FeltBytes* public_key,
    const FeltBytes* message_hash,
    const FeltBytes* r,
    const FeltBytes* s
);

/**
 * Recover public key from signature
 * Returns STARK_RECOVERY_FAILED on error
 */
StarkResult starknet_recover(
    const FeltBytes* message_hash,
    const FeltBytes* r,
    const FeltBytes* s,
    const FeltBytes* v,
    FeltBytes* out
);

#endif /* STARKNET_CRYPTO_H */
