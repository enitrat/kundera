import { describe, it, expect } from 'vitest';
import { eventFromRpc, eventToRpc, emittedEventFromRpc, emittedEventToRpc } from './event.js';
import { hexToFelt } from './helpers.js';
import type { Event, EmittedEvent } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

describe('event', () => {
  const wire: Event = {
    from_address: '0x01',
    keys: ['0x02', '0x03'],
    data: ['0x04'],
  };

  it('round-trips', () => {
    const rich = eventFromRpc(wire);
    expect(rich.from_address.toBigInt()).toBe(1n);
    expect(rich.keys.length).toBe(2);
    const back = eventToRpc(rich);
    expect(back.from_address).toBe(canon('0x01'));
    expect(back.keys.length).toBe(2);
  });
});

describe('emittedEvent', () => {
  const wire: EmittedEvent = {
    from_address: '0x01',
    keys: ['0x02'],
    data: ['0x03'],
    block_hash: '0x0b0',
    block_number: 99,
    transaction_hash: '0x0a0',
  };

  it('round-trips', () => {
    const rich = emittedEventFromRpc(wire);
    expect(rich.block_number).toBe(99);
    expect(rich.block_hash.toBigInt()).toBe(BigInt('0x0b0'));
    expect(rich.transaction_hash.toBigInt()).toBe(BigInt('0x0a0'));
    const back = emittedEventToRpc(rich);
    expect(back.block_number).toBe(99);
    expect(back.block_hash).toBe(canon('0x0b0'));
  });
});
