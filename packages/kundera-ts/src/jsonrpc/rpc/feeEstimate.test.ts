import { describe, it, expect } from 'vitest';
import { feeEstimateFromRpc, feeEstimateToRpc } from './feeEstimate.js';
import { hexToFelt } from './helpers.js';
import type { FeeEstimate } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

describe('feeEstimate', () => {
  const wire: FeeEstimate = {
    gas_consumed: '0x100',
    gas_price: '0x200',
    data_gas_consumed: '0x300',
    data_gas_price: '0x400',
    overall_fee: '0x500',
    unit: 'FRI',
  };

  it('round-trips', () => {
    const rich = feeEstimateFromRpc(wire);
    expect(rich.unit).toBe('FRI');
    expect(rich.gas_consumed.toBigInt()).toBe(BigInt('0x100'));

    const back = feeEstimateToRpc(rich);
    expect(back.gas_consumed).toBe(canon('0x100'));
    expect(back.unit).toBe('FRI');
  });
});
