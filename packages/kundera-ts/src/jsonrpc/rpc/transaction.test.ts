import { describe, it, expect } from 'vitest';
import { transactionFromRpc, transactionToRpc } from './transaction.js';
import { hexToFelt } from './helpers.js';
import type { TxnWithHash } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

describe('transaction', () => {
  describe('InvokeTxnV1', () => {
    const wire: TxnWithHash = {
      type: 'INVOKE',
      version: '0x1',
      transaction_hash: '0x0abc',
      sender_address: '0x01',
      calldata: ['0x02', '0x03'],
      max_fee: '0x0ff',
      signature: ['0x0a', '0x0b'],
      nonce: '0x05',
    };

    it('round-trips', () => {
      const rich = transactionFromRpc(wire);
      expect(rich.type).toBe('INVOKE');
      expect(rich.transaction_hash.toBigInt()).toBe(BigInt('0x0abc'));

      const back = transactionToRpc(rich);
      expect(back.type).toBe('INVOKE');
      expect(back.transaction_hash).toBe(canon('0x0abc'));
    });
  });

  describe('InvokeTxnV3', () => {
    const wire: TxnWithHash = {
      type: 'INVOKE',
      version: '0x3',
      transaction_hash: '0x0abc',
      sender_address: '0x01',
      calldata: ['0x02'],
      signature: ['0x0a'],
      nonce: '0x05',
      resource_bounds: {
        l1_gas: { max_amount: '0x10', max_price_per_unit: '0x20' },
        l2_gas: { max_amount: '0x30', max_price_per_unit: '0x40' },
      },
      tip: '0x00',
      paymaster_data: [],
      account_deployment_data: [],
      nonce_data_availability_mode: 'L1',
      fee_data_availability_mode: 'L1',
    };

    it('round-trips', () => {
      const rich = transactionFromRpc(wire);
      const back = transactionToRpc(rich);
      expect(back.type).toBe('INVOKE');
      expect(back.version).toBe('0x3');
      expect(back.transaction_hash).toBe(canon('0x0abc'));
    });
  });

  describe('DeclareTxnV2', () => {
    const wire: TxnWithHash = {
      type: 'DECLARE',
      version: '0x2',
      transaction_hash: '0x0def',
      sender_address: '0x01',
      compiled_class_hash: '0x0cc',
      max_fee: '0x0ff',
      signature: ['0x0a'],
      nonce: '0x01',
      class_hash: '0x0bb',
    };

    it('round-trips', () => {
      const rich = transactionFromRpc(wire);
      expect(rich.type).toBe('DECLARE');
      const back = transactionToRpc(rich);
      expect(back.transaction_hash).toBe(canon('0x0def'));
    });
  });

  describe('DeployAccountTxnV1', () => {
    const wire: TxnWithHash = {
      type: 'DEPLOY_ACCOUNT',
      version: '0x1',
      transaction_hash: '0x0123',
      max_fee: '0x0ff',
      signature: ['0x0a'],
      nonce: '0x00',
      contract_address_salt: '0x0aa',
      constructor_calldata: ['0x01', '0x02'],
      class_hash: '0x0cc',
    };

    it('round-trips', () => {
      const rich = transactionFromRpc(wire);
      expect(rich.type).toBe('DEPLOY_ACCOUNT');
      const back = transactionToRpc(rich);
      expect(back.type).toBe('DEPLOY_ACCOUNT');
      expect(back.transaction_hash).toBe(canon('0x0123'));
    });
  });

  describe('L1HandlerTxn', () => {
    const wire: TxnWithHash = {
      type: 'L1_HANDLER',
      version: '0x0',
      transaction_hash: '0x0456',
      nonce: '0x00',
      contract_address: '0x01',
      entry_point_selector: '0x0ee',
      calldata: ['0x01'],
    };

    it('round-trips', () => {
      const rich = transactionFromRpc(wire);
      expect(rich.type).toBe('L1_HANDLER');
      const back = transactionToRpc(rich);
      expect(back.type).toBe('L1_HANDLER');
      expect(back.transaction_hash).toBe(canon('0x0456'));
    });
  });
});
