/**
 * Provider Request Options
 *
 * Optional configuration for provider requests.
 *
 * @module provider/request/RequestOptions
 */

export interface RequestOptions {
	/** Max number of retries (default: 0) */
	retryCount?: number;
	/** Base delay between retries in ms (default: 0) */
	retryDelay?: number;
	/** Request timeout in ms (optional) */
	timeout?: number;
}
