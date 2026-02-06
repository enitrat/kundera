// Types
export type { Int32Type, Int32Input } from "./types.js";

// Constants
export { MIN, MAX, SIZE, PRIME } from "./constants.js";

// Errors
export { Int32RangeError, Int32ParseError } from "./errors.js";

// Direct exports (for namespace import pattern: import * as Int32)
export { from } from "./from.js";
export { fromFelt } from "./fromFelt.js";
export { toBigInt } from "./toBigInt.js";
export { toHex } from "./toHex.js";
export { toFelt } from "./toFelt.js";

// Internal exports (for advanced users who need bare functions)
export { from as _from } from "./from.js";
export { fromFelt as _fromFelt } from "./fromFelt.js";
export { toBigInt as _toBigInt } from "./toBigInt.js";
export { toHex as _toHex } from "./toHex.js";
export { toFelt as _toFelt } from "./toFelt.js";

// Main export
export { Int32 } from "./Int32.js";
