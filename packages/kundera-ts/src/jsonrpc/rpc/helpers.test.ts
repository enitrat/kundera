import { describe, it, expect } from 'vitest';
import {
  hexToFelt,
  hexToAddress,
  hexToClassHash,
  hexToFelts,
  feltToHex,
  addressToHex,
  classHashToHex,
  feltsToHex,
  resourcePriceFromRpc,
  resourcePriceToRpc,
  resourceBoundsFromRpc,
  resourceBoundsToRpc,
  resourceBoundsMappingFromRpc,
  resourceBoundsMappingToRpc,
  feePaymentFromRpc,
  feePaymentToRpc,
} from './helpers.js';

/** Canonicalize: fromHex pads to 32 bytes, toHex returns full-length */
function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

describe('helpers', () => {
  const hex = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

  describe('hexToFelt / feltToHex', () => {
    it('round-trips', () => {
      const felt = hexToFelt(hex);
      expect(feltToHex(felt)).toBe(hex);
    });

    it('canonicalizes short hex', () => {
      const felt = hexToFelt('0x0a');
      expect(feltToHex(felt)).toBe(canon('0x0a'));
    });
  });

  describe('hexToAddress / addressToHex', () => {
    it('round-trips', () => {
      const addr = hexToAddress(hex);
      expect(addressToHex(addr)).toBe(hex);
    });
  });

  describe('hexToClassHash / classHashToHex', () => {
    it('round-trips', () => {
      const ch = hexToClassHash(hex);
      expect(classHashToHex(ch)).toBe(hex);
    });
  });

  describe('hexToFelts / feltsToHex', () => {
    it('round-trips array', () => {
      const hexArr = ['0x01', '0x02', '0x03'];
      const felts = hexToFelts(hexArr);
      const back = feltsToHex(felts);
      expect(back).toEqual(hexArr.map(canon));
    });

    it('handles empty array', () => {
      expect(feltsToHex(hexToFelts([]))).toEqual([]);
    });
  });

  describe('resourcePrice', () => {
    it('round-trips', () => {
      const wire = { price_in_fri: '0x0a', price_in_wei: '0x0b' };
      const back = resourcePriceToRpc(resourcePriceFromRpc(wire));
      expect(back.price_in_fri).toBe(canon('0x0a'));
      expect(back.price_in_wei).toBe(canon('0x0b'));
    });
  });

  describe('resourceBounds', () => {
    it('round-trips', () => {
      const wire = { max_amount: '0x10', max_price_per_unit: '0x20' };
      const back = resourceBoundsToRpc(resourceBoundsFromRpc(wire));
      expect(back.max_amount).toBe(canon('0x10'));
      expect(back.max_price_per_unit).toBe(canon('0x20'));
    });
  });

  describe('resourceBoundsMapping', () => {
    it('round-trips', () => {
      const wire = {
        l1_gas: { max_amount: '0x10', max_price_per_unit: '0x20' },
        l2_gas: { max_amount: '0x30', max_price_per_unit: '0x40' },
      };
      const rich = resourceBoundsMappingFromRpc(wire);
      const back = resourceBoundsMappingToRpc(rich);
      expect(back.l1_gas.max_amount).toBe(canon('0x10'));
      expect(back.l2_gas.max_price_per_unit).toBe(canon('0x40'));
    });
  });

  describe('feePayment', () => {
    it('round-trips', () => {
      const wire = { amount: '0x100', unit: 'WEI' as const };
      const rich = feePaymentFromRpc(wire);
      expect(rich.unit).toBe('WEI');
      const back = feePaymentToRpc(rich);
      expect(back.amount).toBe(canon('0x100'));
      expect(back.unit).toBe('WEI');
    });
  });
});
