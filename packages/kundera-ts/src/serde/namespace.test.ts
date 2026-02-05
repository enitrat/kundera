import { describe, expect, test } from 'vitest';
import {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} from './index';

describe('CairoSerde namespace', () => {
  test('has all functions', () => {
    expect(CairoSerde.serializeU256).toBe(serializeU256);
    expect(CairoSerde.deserializeU256).toBe(deserializeU256);
    expect(CairoSerde.serializeArray).toBe(serializeArray);
    expect(CairoSerde.deserializeArray).toBe(deserializeArray);
    expect(CairoSerde.serializeByteArray).toBe(serializeByteArray);
  });
});
