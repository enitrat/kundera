import { describe, it, expect } from 'vitest';
import {
  functionInvocationFromRpc,
  functionInvocationToRpc,
  transactionTraceFromRpc,
  transactionTraceToRpc,
} from './trace.js';
import { hexToFelt } from './helpers.js';
import type { FunctionInvocation, TransactionTrace } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

const wireFnInvocation: FunctionInvocation = {
  contract_address: '0x01',
  entry_point_selector: '0x02',
  calldata: ['0x03'],
  caller_address: '0x04',
  class_hash: '0x05',
  entry_point_type: 'EXTERNAL',
  call_type: 'CALL',
  result: ['0x06'],
  calls: [],
  events: [{ order: 0, keys: ['0x07'], data: ['0x08'] }],
  messages: [{ order: 0, to_address: '0x09', payload: ['0x0a'] }],
  execution_resources: { l1_gas: 10, l2_gas: 20 },
};

describe('functionInvocation', () => {
  it('round-trips', () => {
    const rich = functionInvocationFromRpc(wireFnInvocation);
    expect(rich.contract_address.toBigInt()).toBe(1n);
    expect(rich.entry_point_type).toBe('EXTERNAL');
    expect(rich.events[0]!.keys[0]!.toBigInt()).toBe(7n);
    expect(rich.messages[0]!.to_address.toBigInt()).toBe(9n);

    const back = functionInvocationToRpc(rich);
    expect(back.contract_address).toBe(canon('0x01'));
    expect(back.events[0]!.keys[0]).toBe(canon('0x07'));
  });

  it('handles nested calls', () => {
    const nested: FunctionInvocation = {
      ...wireFnInvocation,
      calls: [wireFnInvocation],
    };
    const rich = functionInvocationFromRpc(nested);
    expect(rich.calls.length).toBe(1);
    expect(rich.calls[0]!.contract_address.toBigInt()).toBe(1n);

    const back = functionInvocationToRpc(rich);
    expect(back.calls.length).toBe(1);
    expect(back.calls[0]!.contract_address).toBe(canon('0x01'));
  });
});

describe('transactionTrace', () => {
  it('round-trips invoke trace', () => {
    const wire: TransactionTrace = {
      type: 'INVOKE',
      execute_invocation: wireFnInvocation,
      execution_resources: { steps: 100 },
    };
    const rich = transactionTraceFromRpc(wire);
    expect(rich.type).toBe('INVOKE');
    const back = transactionTraceToRpc(rich);
    expect(back.type).toBe('INVOKE');
  });

  it('round-trips reverted invoke trace', () => {
    const wire: TransactionTrace = {
      type: 'INVOKE',
      execute_invocation: { revert_reason: 'out of gas' },
      execution_resources: { steps: 50 },
    };
    const rich = transactionTraceFromRpc(wire);
    if (rich.type === 'INVOKE' && 'revert_reason' in rich.execute_invocation) {
      expect(rich.execute_invocation.revert_reason).toBe('out of gas');
    }
    const back = transactionTraceToRpc(rich);
    if (back.type === 'INVOKE' && 'revert_reason' in back.execute_invocation) {
      expect(back.execute_invocation.revert_reason).toBe('out of gas');
    }
  });

  it('round-trips deploy account trace', () => {
    const wire: TransactionTrace = {
      type: 'DEPLOY_ACCOUNT',
      constructor_invocation: wireFnInvocation,
      execution_resources: { steps: 200 },
    };
    const rich = transactionTraceFromRpc(wire);
    expect(rich.type).toBe('DEPLOY_ACCOUNT');
    const back = transactionTraceToRpc(rich);
    expect(back.type).toBe('DEPLOY_ACCOUNT');
  });

  it('round-trips L1 handler trace', () => {
    const wire: TransactionTrace = {
      type: 'L1_HANDLER',
      function_invocation: wireFnInvocation,
      execution_resources: { steps: 150 },
    };
    const rich = transactionTraceFromRpc(wire);
    expect(rich.type).toBe('L1_HANDLER');
    const back = transactionTraceToRpc(rich);
    expect(back.type).toBe('L1_HANDLER');
  });
});
