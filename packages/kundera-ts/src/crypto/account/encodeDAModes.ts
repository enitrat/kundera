/**
 * Encode DA Modes
 *
 * Encode data availability modes into a single felt.
 */

import type { DataAvailabilityMode } from "../account-types.js";

/**
 * Encode data availability modes into a single felt
 * Layout per spec:
 *   - bits 0-31: fee_data_availability_mode
 *   - bits 32-63: nonce_data_availability_mode
 * (both currently 0 for L1 mode)
 */
export function encodeDAModes(
	nonceDAMode: DataAvailabilityMode,
	feeDAMode: DataAvailabilityMode,
): bigint {
	return (BigInt(nonceDAMode) << 32n) | BigInt(feeDAMode);
}
