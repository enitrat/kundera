/**
 * CairoSerde Namespace
 *
 * Namespace object for Cairo serialization/deserialization operations.
 */

import { serializeU256 } from './serializeU256.js';
import { deserializeU256 } from './deserializeU256.js';
import { serializeArray } from './serializeArray.js';
import { deserializeArray } from './deserializeArray.js';
import { serializeByteArray } from './serializeByteArray.js';

export const CairoSerde = {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
} as const;
