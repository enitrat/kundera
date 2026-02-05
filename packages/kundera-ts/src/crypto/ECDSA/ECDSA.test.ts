import { describe, expect, test } from 'bun:test';
import { ECDSA, sign, verify, getPublicKey, getPublicKeyFull, recover } from './index';
import { Felt252 } from '../../primitives/index';

describe('ECDSA (Pure JS)', () => {
  // Test vectors from @scure/starknet test suite
  const testPrivateKey = '2dccce1da22003777062ee0870e9881b460a8b7eca276870f57c601f182136c';

  // Signature test vectors from @scure/starknet
  const signatureVectors = [
    {
      msg: 'c465dd6b1bbffdb05442eb17f5ca38ad1aa78a6f56bf4415bdee219114a47',
      r: '5f496f6f210b5810b2711c74c15c05244dad43d18ecbbdbe6ed55584bc3b0a2',
      s: '4e8657b153787f741a67c0666bad6426c3741b478c8eaa3155196fc571416f3',
    },
    {
      msg: 'c465dd6b1bbffdb05442eb17f5ca38ad1aa78a6f56bf4415bdee219114a47a',
      r: '233b88c4578f0807b4a7480c8076eca5cfefa29980dd8e2af3c46a253490e9c',
      s: '28b055e825bc507349edfb944740a35c6f22d377443c34742c04e0d82278cf1',
    },
    {
      msg: '7465dd6b1bbffdb05442eb17f5ca38ad1aa78a6f56bf4415bdee219114a47a1',
      r: 'b6bee8010f96a723f6de06b5fa06e820418712439c93850dd4e9bde43ddf',
      s: '1a3d2bc954ed77e22986f507d68d18115fa543d1901f5b4620db98e2f6efd80',
    },
  ];

  describe('sign test vectors', () => {
    for (const vec of signatureVectors) {
      test(`sign(${vec.msg.slice(0, 20)}...)`, () => {
        const sig = sign(Felt252(`0x${testPrivateKey}`), Felt252(`0x${vec.msg}`));
        expect(sig.r.toBigInt().toString(16)).toBe(vec.r);
        expect(sig.s.toBigInt().toString(16)).toBe(vec.s);
      });
    }
  });

  describe('verify test vectors', () => {
    const pubKey = getPublicKey(Felt252(`0x${testPrivateKey}`));

    for (const vec of signatureVectors) {
      test(`verify(${vec.msg.slice(0, 20)}...)`, () => {
        const sig = { r: Felt252(`0x${vec.r}`), s: Felt252(`0x${vec.s}`) };
        const isValid = verify(pubKey, Felt252(`0x${vec.msg}`), sig);
        expect(isValid).toBe(true);
      });
    }
  });

  // Additional cross-test vectors
  const crossTestVectors = [
    {
      msg: '00',
      r: '443b6a567dfeae1c8c77dc589cdde204649f85ba45e54bead543299e5888233',
      s: '12bcacdadecfca0773945071b371adda1bc47fce319f80aa590b06d45a996f5',
      privateKey: '7D0F499B250763F4CACF0D8D9E267D012C03503CE5DE876B33D3A3837DC90AF',
    },
    {
      msg: '40DC8ABE9797B6EF5C0886AD4A78405CD393493D2B6A8733B77250F61',
      r: '78a73ac7f793e706e50871da2efc2f83c30852a90110cab71108ff6a3af864e',
      s: '49ec9e6aa783e7518ffc05ec054db3ddf2d8ad301e4ee790392841fa759431e',
      privateKey: '7D0F499B250763F4CACF0D8D9E267D012C03503CE5DE876B33D3A3837DC90AF',
    },
  ];

  describe('cross-test vectors', () => {
    for (const vec of crossTestVectors) {
      test(`sign cross-test(${vec.msg.slice(0, 20)}...)`, () => {
        const sig = sign(Felt252(`0x${vec.privateKey}`), Felt252(`0x${vec.msg}`));
        expect(sig.r.toBigInt().toString(16)).toBe(vec.r);
        expect(sig.s.toBigInt().toString(16)).toBe(vec.s);
      });
    }
  });

  // Keep original roundtrip tests with generic keys
  const privateKey = Felt252('0x0139fe4d6f02e666e86a6f58e65060f115cd3c185bd9e98bd829636931458f79');
  const messageHash = Felt252('0x06fea80189363a786037ed3e7ba546dad0ef7de49fccae0e31eb658b7dd4ea76');

  describe('sign', () => {
    test('produces deterministic signatures', () => {
      const sig1 = sign(privateKey, messageHash);
      const sig2 = sign(privateKey, messageHash);
      expect(sig1.r.toBigInt()).toBe(sig2.r.toBigInt());
      expect(sig1.s.toBigInt()).toBe(sig2.s.toBigInt());
    });
  });

  describe('getPublicKey', () => {
    test('derives public key from private key', () => {
      const pubKey = getPublicKey(privateKey);
      // Felt252Type is a branded Uint8Array
      expect(pubKey instanceof Uint8Array).toBe(true);
      expect(pubKey.length).toBe(32);
    });

    test('produces deterministic public key', () => {
      const pub1 = getPublicKey(privateKey);
      const pub2 = getPublicKey(privateKey);
      expect(pub1.toString()).toBe(pub2.toString());
    });
  });

  describe('verify', () => {
    test('verifies valid signature with X-coordinate pubKey', () => {
      const pubKey = getPublicKey(privateKey);
      const signature = sign(privateKey, messageHash);
      const isValid = verify(pubKey, messageHash, signature);
      expect(isValid).toBe(true);
    });

    test('verifies valid signature with full pubKey', () => {
      const pubKeyFull = getPublicKeyFull(privateKey);
      const signature = sign(privateKey, messageHash);
      const isValid = verify(pubKeyFull, messageHash, signature);
      expect(isValid).toBe(true);
    });

    test('rejects invalid signature', () => {
      const pubKey = getPublicKey(privateKey);
      const signature = sign(privateKey, messageHash);
      // Corrupt the signature by using a different r value
      const badSignature = { r: Felt252(123n), s: signature.s };
      const isValid = verify(pubKey, messageHash, badSignature);
      expect(isValid).toBe(false);
    });

    test('rejects wrong message', () => {
      const pubKey = getPublicKey(privateKey);
      const signature = sign(privateKey, messageHash);
      // Use a different message hash (within field prime)
      const wrongMessage = Felt252('0x0111111111111111111111111111111111111111111111111111111111111111');
      const isValid = verify(pubKey, wrongMessage, signature);
      expect(isValid).toBe(false);
    });
  });

  describe('ECDSA namespace', () => {
    test('exports all functions', () => {
      expect(ECDSA.sign).toBe(sign);
      expect(ECDSA.verify).toBe(verify);
      expect(ECDSA.getPublicKey).toBe(getPublicKey);
      expect(typeof ECDSA.recover).toBe('function');
    });
  });

  describe('recover (pure JS)', () => {
    test('recovers public key from signature', () => {
      const pubKey = getPublicKey(privateKey);
      const signature = sign(privateKey, messageHash);

      // Try both recovery values (0 and 1)
      let recovered = null;
      for (const v of [0, 1]) {
        try {
          const candidate = ECDSA.recover(messageHash, signature.r, signature.s, Felt252(v));
          if (candidate.equals(pubKey)) {
            recovered = candidate;
            break;
          }
        } catch {
          // Try next v
        }
      }

      expect(recovered).not.toBeNull();
      expect(recovered!.equals(pubKey)).toBe(true);
    });

    test('throws on invalid recovery parameter', () => {
      const signature = sign(privateKey, messageHash);
      expect(() => ECDSA.recover(messageHash, signature.r, signature.s, Felt252(5n))).toThrow(
        'Invalid recovery parameter'
      );
    });
  });
});
