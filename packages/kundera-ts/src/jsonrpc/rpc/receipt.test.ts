import { describe, it, expect } from 'vitest';
import {
  receiptFromRpc,
  receiptToRpc,
  receiptWithBlockInfoFromRpc,
  receiptWithBlockInfoToRpc,
} from './receipt.js';
import { hexToFelt } from './helpers.js';
import type { TxnReceipt, TxnReceiptWithBlockInfo } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

const commonWire = {
  transaction_hash: '0x0abc',
  actual_fee: { amount: '0x100', unit: 'WEI' as const },
  finality_status: 'ACCEPTED_ON_L2' as const,
  messages_sent: [
    { from_address: '0x01', to_address: '0x02', payload: ['0x03'] },
  ],
  events: [{ from_address: '0x04', keys: ['0x05'], data: ['0x06'] }],
  execution_resources: { steps: 100 },
  execution_status: 'SUCCEEDED' as const,
};

describe('receipt', () => {
  describe('InvokeTxnReceipt', () => {
    const wire: TxnReceipt = { ...commonWire, type: 'INVOKE' };

    it('round-trips', () => {
      const rich = receiptFromRpc(wire);
      expect(rich.type).toBe('INVOKE');
      expect(rich.execution_resources.steps).toBe(100);
      const back = receiptToRpc(rich);
      expect(back.type).toBe('INVOKE');
      expect(back.transaction_hash).toBe(canon('0x0abc'));
    });
  });

  describe('L1HandlerTxnReceipt', () => {
    const wire: TxnReceipt = {
      ...commonWire,
      type: 'L1_HANDLER',
      message_hash: '0xdeadbeef',
    };

    it('round-trips', () => {
      const rich = receiptFromRpc(wire);
      expect(rich.type).toBe('L1_HANDLER');
      if (rich.type === 'L1_HANDLER') {
        expect(rich.message_hash).toBe('0xdeadbeef');
      }
    });
  });

  describe('DeployAccountTxnReceipt', () => {
    const wire: TxnReceipt = {
      ...commonWire,
      type: 'DEPLOY_ACCOUNT',
      contract_address: '0x0cafe',
    };

    it('round-trips', () => {
      const rich = receiptFromRpc(wire);
      expect(rich.type).toBe('DEPLOY_ACCOUNT');
      if (rich.type === 'DEPLOY_ACCOUNT') {
        expect(rich.contract_address.toBigInt()).toBe(BigInt('0x0cafe'));
      }
    });
  });

  describe('receiptWithBlockInfo', () => {
    const wire: TxnReceiptWithBlockInfo = {
      ...commonWire,
      type: 'INVOKE',
      block_hash: '0x0bbb',
      block_number: 42,
    };

    it('round-trips', () => {
      const rich = receiptWithBlockInfoFromRpc(wire);
      expect(rich.block_number).toBe(42);
      expect(rich.block_hash?.toBigInt()).toBe(BigInt('0x0bbb'));
      const back = receiptWithBlockInfoToRpc(rich);
      expect(back.block_hash).toBe(canon('0x0bbb'));
      expect(back.block_number).toBe(42);
    });
  });
});
