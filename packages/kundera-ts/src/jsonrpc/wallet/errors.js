/**
 * Wallet API error codes.
 * Based on starkware-libs/starknet-specs/wallet-api/wallet_rpc.json
 */
export const WalletErrorCode = /** @type {const} */ ({
	/** Chain not added to wallet */
	UNLISTED_NETWORK: 111,
	/** User rejected the request */
	USER_REFUSED_OP: 113,
	/** Invalid request payload */
	INVALID_REQUEST_PAYLOAD: 114,
	/** Account already deployed */
	ACCOUNT_ALREADY_DEPLOYED: 115,
	/** Requested API version not supported */
	API_VERSION_NOT_SUPPORTED: 162,
	/** Unknown or unrecoverable error */
	UNKNOWN_ERROR: 163,
});
