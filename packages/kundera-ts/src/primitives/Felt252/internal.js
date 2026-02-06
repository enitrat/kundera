import { FIELD_PRIME } from "./constants.js";

/**
 * Convert bytes to hex string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}

/**
 * Convert bytes to bigint
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
export function toBigIntInternal(bytes) {
	return BigInt(bytesToHex(bytes));
}

/** @type {import('./types.js').FeltMethods} */
const feltPrototype = Object.create(Uint8Array.prototype);

Object.defineProperties(feltPrototype, {
	toHex: {
		/** @this {Uint8Array} */
		value: function toHex() {
			return bytesToHex(this);
		},
	},
	toBigInt: {
		/** @this {Uint8Array} */
		value: function toBigInt() {
			return toBigIntInternal(this);
		},
	},
	isValid: {
		/** @this {Uint8Array} */
		value: function isValid() {
			return toBigIntInternal(this) < FIELD_PRIME;
		},
	},
	isZero: {
		/** @this {Uint8Array} */
		value: function isZero() {
			for (const byte of this) {
				if (byte !== 0) return false;
			}
			return true;
		},
	},
	equals: {
		/**
		 * @this {Uint8Array}
		 * @param {import('./types.js').Felt252Type} other
		 */
		value: function equals(other) {
			if (this.length !== other.length) return false;
			for (let i = 0; i < this.length; i++) {
				if (this[i] !== other[i]) return false;
			}
			return true;
		},
	},
});

/**
 * Add Felt252 methods to a Uint8Array
 * @param {Uint8Array} bytes
 * @returns {import('./types.js').Felt252Type}
 */
export function withFeltPrototype(bytes) {
	if (Object.getPrototypeOf(bytes) !== feltPrototype) {
		Object.setPrototypeOf(bytes, feltPrototype);
	}
	return /** @type {import('./types.js').Felt252Type} */ (bytes);
}
