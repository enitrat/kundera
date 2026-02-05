import { describe, expect, test } from 'vitest';
import { EthAddress } from './EthAddress';
import { MAX_ETH_ADDRESS } from './constants';

describe('EthAddress', () => {
  test('creates valid ETH address', () => {
    const addr = EthAddress(42n);
    expect(addr.toBigInt()).toBe(42n);
  });

  test('rejects address >= 2^160', () => {
    expect(() => EthAddress(MAX_ETH_ADDRESS)).toThrow('< 2^160');
  });
});

describe('Constants', () => {
  test('MAX_ETH_ADDRESS is 2^160', () => {
    expect(MAX_ETH_ADDRESS).toBe(1n << 160n);
  });
});
