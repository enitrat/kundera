// Types
export type { ByteArrayType, ByteArrayInput, ByteArrayData } from "./types.js";

// Constants
export { BYTES_PER_WORD, BYTE_ARRAY_MAGIC } from "./constants.js";

import { BYTES_PER_WORD, BYTE_ARRAY_MAGIC } from "./constants.js";
// Functions
import { from as _from } from "./from.js";
import { fromString as _fromString } from "./fromString.js";
import { length as _length } from "./length.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toString as _toString } from "./toString.js";

// Internal exports
export { from as _from } from "./from.js";
export { fromString as _fromString } from "./fromString.js";
export { toBytes as _toBytes } from "./toBytes.js";
export { toString as _toString } from "./toString.js";
export { length as _length } from "./length.js";

// Public exports
export const from = _from;
export const fromString = _fromString;
export const toBytes = _toBytes;
export { _toString as toString };
export const length = _length;

/**
 * ByteArray namespace with all functions
 */
export const ByteArray = {
	from: _from,
	fromString: _fromString,
	toBytes: _toBytes,
	toString: _toString,
	length: _length,
	BYTES_PER_WORD,
	BYTE_ARRAY_MAGIC,
} as const;
