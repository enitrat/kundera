/**
 * Account Module Tests
 *
 * Tests for V3 transactions, hash computation, signing, and account operations.
 */

import { describe, it, expect, beforeAll, mock } from 'bun:test';
import {
  // Types
  type ResourceBoundsMapping,
  type InvokeTransactionV3,
  type DeclareTransactionV3,
  type DeployAccountTransactionV3,
  type Call,
  type TypedData,
  // Constants
  TRANSACTION_VERSION,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_HASH_PREFIX,
  // Hash
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  hashResourceBounds,
  hashTipAndResourceBounds,
  encodeDAModes,
  hashCalldata,
  computeContractAddress,
  computeSelector,
  // Signer
  PrivateKeySigner,
  createSigner,
  // Account
  Account,
  createAccount,
  // WalletAccount
  WalletAccount,
  createWalletAccount,
  WalletRequestType,
  type StarknetWalletProvider,
} from './index.js';
import { Felt252, toBigInt, toHex } from '../primitives/index.js';
import {
  isNativeAvailable,
  isWasmAvailable,
  loadWasmCrypto,
  isWasmLoaded,
  getPublicKey,
  verify,
} from '../crypto/index.js';

// ============ Setup ============

beforeAll(async () => {
  // Skip if native is available (Bun)
  if (isNativeAvailable()) {
    return;
  }
  // Load WASM crypto for tests if available
  if (isWasmAvailable() && !isWasmLoaded()) {
    await loadWasmCrypto();
  }
});

// ============ Types Tests ============

describe('Types', () => {
  it('should have correct transaction version constants', () => {
    expect(TRANSACTION_VERSION.V3).toBe(3n);
    expect(TRANSACTION_VERSION.V3_QUERY).toBe(
      0x100000000000000000000000000000003n
    );
  });

  it('should have correct default resource bounds', () => {
    expect(DEFAULT_RESOURCE_BOUNDS.l1_gas.max_amount).toBe(0n);
    expect(DEFAULT_RESOURCE_BOUNDS.l2_gas.max_amount).toBe(0n);
    expect(DEFAULT_RESOURCE_BOUNDS.l1_data_gas.max_amount).toBe(0n);
  });

  it('should have correct transaction hash prefixes', () => {
    // "invoke" as felt
    expect(TRANSACTION_HASH_PREFIX.INVOKE).toBe(0x696e766f6b65n);
    // "declare" as felt
    expect(TRANSACTION_HASH_PREFIX.DECLARE).toBe(0x6465636c617265n);
    // "deploy_account" as felt
    expect(TRANSACTION_HASH_PREFIX.DEPLOY_ACCOUNT).toBe(
      0x6465706c6f795f6163636f756e74n
    );
  });
});

// ============ Golden Vector Tests ============
// These tests verify hash computation against known-good values.
// Computed via starknet.js v6.23.1

describe('Golden Vectors', () => {
  // SN_GOERLI chain ID
  const SN_GOERLI = '0x534e5f474f45524c49';

  describe('INVOKE_V3 Hash Golden Vectors', () => {
    it('should match starknet.js expected hash for invoke transaction', () => {
      // Test vector computed via starknet.js v6.23.1
      const tx: InvokeTransactionV3 = {
        version: 3,
        sender_address: '0x3f6f3bc663aedc5285d6013cc3ffcbc4341d86ab488b8b68d297f8258793c41',
        calldata: [
          0x2n,
          0x4c312760dfd17a954cdd09e76aa9f149f806d88ec3e402ffaf5c4926f568a42n,
          0x31aafc75f498fdfa7528880ad27246b4c15af4954f96228c9a132b328de1c92n,
          0x0n,
          0x6n,
          0x450703c32370cf7ffff540b9352e7ee4ad583af143a361155f2b485c0c39684n,
          0xb17d8a2731ba7ca1816631e6be14f0fc1b8390422d649fa27f0fbb0c91eea8n,
          0x6n,
          0x0n,
          0x6n,
          0x6333f10b24ed58cc33e9bac40b0d52e067e32a175a97ca9e2ce89fe2b002d82n,
          0x3n,
          0x602e89fe5703e5b093d13d0a81c9e6d213338dc15c59f4d3ff3542d1d7dfb7dn,
          0x20d621301bea11ffd9108af1d65847e9049412159294d0883585d4ad43ad61bn,
          0x276faadb842bfcbba834f3af948386a2eb694f7006e118ad6c80305791d3247n,
          0x613816405e6334ab420e53d4b38a0451cb2ebca2755171315958c87d303cf6n,
        ],
        nonce: 0x8a9n,
        resource_bounds: {
          l1_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
          l2_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
          l1_data_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
        },
        tip: 0n,
        paymaster_data: [],
        nonce_data_availability_mode: 0,
        fee_data_availability_mode: 0,
        account_deployment_data: [],
      };

      const hash = computeInvokeV3Hash(tx, SN_GOERLI);

      // Expected hash computed via starknet.js v6.23.1
      expect(toHex(hash)).toBe(
        '0x071431d13ca35a1eab3ebd0b69f586d46d0d3e2dd2259ce74840cf4249d8bd19'
      );
    });
  });

  describe('DECLARE_V3 Hash Golden Vectors', () => {
    it('should match starknet.js expected hash for declare transaction', () => {
      // Test vector with same resource bounds as invoke test
      const tx: DeclareTransactionV3 = {
        version: 3,
        sender_address: '0x2fab82e4aef1d8664874e1f194951856d48463c3e6bf9a8c68e234a629a6f50',
        class_hash: '0x5ae9d09292a50ed48c5930904c880dab56e85b825022a7d689cfc9e65e01ee7',
        compiled_class_hash: '0x1add56d64bebf8140f3b8a38bdf102b7874437f0c861ab4ca7526ec33b4d0f8',
        nonce: 1n,
        resource_bounds: {
          l1_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x2540be400n },
          l2_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x2540be400n },
          l1_data_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x2540be400n },
        },
        tip: 0n,
        paymaster_data: [],
        nonce_data_availability_mode: 0,
        fee_data_availability_mode: 0,
        account_deployment_data: [],
      };

      const hash = computeDeclareV3Hash(tx, SN_GOERLI);

      // Expected hash computed via starknet.js v6.23.1
      expect(toHex(hash)).toBe(
        '0x058783234a77a91805d4ff77d31ffd977c805b7996ae90b087995d739f7161e8'
      );
    });
  });

  describe('DEPLOY_ACCOUNT_V3 Hash Golden Vectors', () => {
    it('should match starknet.js expected hash for deploy account transaction', () => {
      // Test vector computed via starknet.js v6.23.1
      const tx: DeployAccountTransactionV3 = {
        version: 3,
        class_hash: '0x2338634f11772ea342365abd5be9d9dc8a6f44f159ad782fdebd3db5d969738',
        constructor_calldata: [
          0x5cd65f3d7daea6c63939d659b8473ea0c5cd81576035a4d34e52fb06840196cn,
        ],
        contract_address_salt: '0x0',
        nonce: 0n,
        resource_bounds: {
          l1_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
          l2_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
          l1_data_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
        },
        tip: 0n,
        paymaster_data: [],
        nonce_data_availability_mode: 0,
        fee_data_availability_mode: 0,
      };

      // Use a valid contract address (fits within Starknet field)
      const contractAddress = '0x04a0c88f6b1d11b2a0c1e5f8c8c8e95c1d2b3a4f5e6d7c8b9a0f1e2d3c4b5a6';

      const hash = computeDeployAccountV3Hash(tx, contractAddress, SN_GOERLI);

      // Expected hash computed via starknet.js v6.23.1 with contractAddress above
      expect(toHex(hash)).toBe(
        '0x0521b7f749c9b8e96437f8c26a4b8c0acc51aaf5334f02fffccedc0853fd0dae'
      );
    });
  });

  describe('Resource Bounds Encoding Golden Vectors', () => {
    it('should match starknet.js hashFeeField for tip + resource bounds', () => {
      // Test vector computed via starknet.js v6.23.1 hashFeeField(0, bounds)
      const resourceBounds: ResourceBoundsMapping = {
        l1_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
        l2_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
        l1_data_gas: { max_amount: 0x186a0n, max_price_per_unit: 0x5af3107a4000n },
      };
      const tip = 0n;

      const feeFieldHash = hashTipAndResourceBounds(tip, resourceBounds);

      // Expected hash from starknet.js v6.23.1 hashFeeField(0, bounds)
      expect(toHex(feeFieldHash)).toBe(
        '0x0242e62a3c414ea95d9a8b5034e6535cec5dd5fe65f5c0e07bf7c1aba75a0df7'
      );
    });
  });

  describe('Contract Address Golden Vectors', () => {
    it('should compute deterministic contract address', () => {
      // Uses same values as deploy_account test for consistency
      const classHash = '0x2338634f11772ea342365abd5be9d9dc8a6f44f159ad782fdebd3db5d969738';
      const salt = '0x0';
      const constructorCalldata = [
        0x5cd65f3d7daea6c63939d659b8473ea0c5cd81576035a4d34e52fb06840196cn,
      ];

      const address = computeContractAddress(classHash, salt, constructorCalldata);

      expect(address).toBeInstanceOf(Uint8Array);
      expect(address.length).toBe(32);

      // Verify determinism
      const address2 = computeContractAddress(classHash, salt, constructorCalldata);
      expect(toHex(address)).toBe(toHex(address2));
    });

    it('should compute different address with deployer', () => {
      const classHash = '0x2338634f11772ea342365abd5be9d9dc8a6f44f159ad782fdebd3db5d969738';
      const salt = '0x12345678';
      const constructorCalldata = [1n, 2n, 3n];
      const deployerAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

      const address = computeContractAddress(classHash, salt, constructorCalldata, deployerAddress);
      const addressNoDeployer = computeContractAddress(classHash, salt, constructorCalldata);

      // With deployer should be different from without
      expect(toHex(address)).not.toBe(toHex(addressNoDeployer));
    });
  });

  describe('Selector Golden Vectors', () => {
    it('should compute correct __execute__ selector', () => {
      const selector = computeSelector('__execute__');
      // toHex returns 32-byte padded values
      expect(toHex(selector)).toBe(
        '0x015d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad'
      );
    });

    it('should compute correct transfer selector', () => {
      const selector = computeSelector('transfer');
      expect(toHex(selector)).toBe(
        '0x0083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e'
      );
    });

    it('should compute correct approve selector', () => {
      const selector = computeSelector('approve');
      expect(toHex(selector)).toBe(
        '0x0219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c'
      );
    });

    it('should compute correct balanceOf selector', () => {
      const selector = computeSelector('balanceOf');
      expect(toHex(selector)).toBe(
        '0x02e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e'
      );
    });
  });
});

// ============ Resource Bounds Encoding Tests ============

describe('Resource Bounds Encoding', () => {
  it('should hash resource bounds correctly', () => {
    const resourceBounds: ResourceBoundsMapping = {
      l1_gas: { max_amount: 1000n, max_price_per_unit: 100n },
      l2_gas: { max_amount: 2000n, max_price_per_unit: 200n },
      l1_data_gas: { max_amount: 500n, max_price_per_unit: 50n },
    };

    const hash = hashResourceBounds(resourceBounds);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  it('should encode DA modes correctly', () => {
    // Both L1 mode (0)
    const daModes = encodeDAModes(0, 0);
    expect(daModes).toBe(0n);

    // Different modes would be encoded as (nonce << 32) | fee
    // Since both are 0 for L1, result is 0
  });

  it('should produce deterministic resource bounds hash', () => {
    const resourceBounds: ResourceBoundsMapping = {
      l1_gas: { max_amount: 10000n, max_price_per_unit: 1000000000n },
      l2_gas: { max_amount: 50000n, max_price_per_unit: 500000000n },
      l1_data_gas: { max_amount: 1000n, max_price_per_unit: 100000000n },
    };

    const hash1 = hashResourceBounds(resourceBounds);
    const hash2 = hashResourceBounds(resourceBounds);
    expect(toHex(hash1)).toBe(toHex(hash2));
  });
});

// ============ Calldata Hash Tests ============

describe('Calldata Hash', () => {
  it('should hash empty calldata', () => {
    const hash = hashCalldata([]);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
    // Empty array poseidon hash (precomputed, matches starknet.js)
    expect(toHex(hash)).toBe(
      '0x02272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbc'
    );
  });

  it('should hash non-empty calldata', () => {
    const calldata = [1n, 2n, 3n];
    const hash = hashCalldata(calldata);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  it('should produce different hashes for different calldata', () => {
    const hash1 = hashCalldata([1n, 2n, 3n]);
    const hash2 = hashCalldata([1n, 2n, 4n]);
    expect(toHex(hash1)).not.toBe(toHex(hash2));
  });
});

// ============ INVOKE_V3 Hash Tests ============

describe('computeInvokeV3Hash', () => {
  const chainId = '0x534e5f5345504f4c4941'; // SN_SEPOLIA
  // Valid sender address (< 2^251)
  const senderAddress = '0x123456789abcdef123456789abcdef12345678';

  it('should compute invoke hash for simple transaction', () => {
    const tx: InvokeTransactionV3 = {
      version: 3,
      sender_address: senderAddress,
      calldata: [1n, 2n, 3n],
      nonce: 0n,
      resource_bounds: DEFAULT_RESOURCE_BOUNDS,
      tip: 0n,
      paymaster_data: [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const hash = computeInvokeV3Hash(tx, chainId);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  it('should produce different hashes for different nonces', () => {
    const tx1: InvokeTransactionV3 = {
      version: 3,
      sender_address: senderAddress,
      calldata: [1n],
      nonce: 0n,
      resource_bounds: DEFAULT_RESOURCE_BOUNDS,
      tip: 0n,
      paymaster_data: [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const tx2 = { ...tx1, nonce: 1n };

    const hash1 = computeInvokeV3Hash(tx1, chainId);
    const hash2 = computeInvokeV3Hash(tx2, chainId);

    expect(toHex(hash1)).not.toBe(toHex(hash2));
  });

  it('should produce different hashes for different calldata', () => {
    const tx1: InvokeTransactionV3 = {
      version: 3,
      sender_address: senderAddress,
      calldata: [1n],
      nonce: 0n,
      resource_bounds: DEFAULT_RESOURCE_BOUNDS,
      tip: 0n,
      paymaster_data: [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const tx2 = { ...tx1, calldata: [2n] };

    const hash1 = computeInvokeV3Hash(tx1, chainId);
    const hash2 = computeInvokeV3Hash(tx2, chainId);

    expect(toHex(hash1)).not.toBe(toHex(hash2));
  });
});

// ============ DECLARE_V3 Hash Tests ============

describe('computeDeclareV3Hash', () => {
  const chainId = '0x534e5f5345504f4c4941';

  it('should compute declare hash', () => {
    const tx: DeclareTransactionV3 = {
      version: 3,
      sender_address: '0x123456789abcdef123456789abcdef12345678',
      class_hash: '0xaabbccdd00112233aabbccdd00112233aabbccdd',
      compiled_class_hash: '0x112233445566778811223344556677881122',
      nonce: 0n,
      resource_bounds: DEFAULT_RESOURCE_BOUNDS,
      tip: 0n,
      paymaster_data: [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
      account_deployment_data: [],
    };

    const hash = computeDeclareV3Hash(tx, chainId);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });
});

// ============ DEPLOY_ACCOUNT_V3 Hash Tests ============

describe('computeDeployAccountV3Hash', () => {
  const chainId = '0x534e5f5345504f4c4941';

  it('should compute deploy account hash', () => {
    const tx: DeployAccountTransactionV3 = {
      version: 3,
      class_hash: '0xaabbccdd00112233aabbccdd00112233aabbccdd',
      constructor_calldata: [1n, 2n],
      contract_address_salt: '0x1234',
      nonce: 0n,
      resource_bounds: DEFAULT_RESOURCE_BOUNDS,
      tip: 0n,
      paymaster_data: [],
      nonce_data_availability_mode: 0,
      fee_data_availability_mode: 0,
    };

    const contractAddress = '0x567890abcdef567890abcdef567890abcdef5678';

    const hash = computeDeployAccountV3Hash(tx, contractAddress, chainId);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });
});

// ============ Contract Address Tests ============

describe('computeContractAddress', () => {
  it('should compute contract address', () => {
    const classHash = '0x123456789abcdef123456789abcdef12345678';
    const salt = '0xabcd';
    const constructorCalldata = [1n, 2n];

    const address = computeContractAddress(classHash, salt, constructorCalldata);
    expect(address).toBeInstanceOf(Uint8Array);
    expect(address.length).toBe(32);
  });

  it('should produce different addresses for different salts', () => {
    const classHash = '0x123456789abcdef123456789abcdef12345678';
    const constructorCalldata = [1n, 2n];

    const addr1 = computeContractAddress(classHash, '0x1', constructorCalldata);
    const addr2 = computeContractAddress(classHash, '0x2', constructorCalldata);

    expect(toHex(addr1)).not.toBe(toHex(addr2));
  });
});

// ============ Selector Tests ============

describe('computeSelector', () => {
  it('should compute selector for __execute__', () => {
    const selector = computeSelector('__execute__');
    expect(selector).toBeInstanceOf(Uint8Array);
    expect(selector.length).toBe(32);
  });

  it('should compute different selectors for different functions', () => {
    const sel1 = computeSelector('transfer');
    const sel2 = computeSelector('approve');
    expect(toHex(sel1)).not.toBe(toHex(sel2));
  });
});

// ============ Signer Tests ============

describe('PrivateKeySigner', () => {
  // Test private key - must be < FIELD_PRIME (DO NOT use in production)
  const testPrivateKey =
    '0x123456789abcdef123456789abcdef123456789abcdef1234';

  it('should create signer from hex string', () => {
    const signer = new PrivateKeySigner(testPrivateKey);
    expect(signer).toBeInstanceOf(PrivateKeySigner);
  });

  it('should create signer from bigint', () => {
    const signer = new PrivateKeySigner(0x1234n);
    expect(signer).toBeInstanceOf(PrivateKeySigner);
  });

  it('should derive correct public key', async () => {
    const signer = new PrivateKeySigner(testPrivateKey);
    const pubKey = await signer.getPubKey();

    // Should be hex string
    expect(pubKey.startsWith('0x')).toBe(true);

    // Verify against crypto module
    const expectedPubKey = toHex(getPublicKey(Felt252(testPrivateKey)));
    expect(pubKey).toBe(expectedPubKey);
  });

  it('should sign message hash', async () => {
    const signer = new PrivateKeySigner(testPrivateKey);
    const messageHash = Felt252(0xdeadbeefn);

    const signature = await signer.signRaw(messageHash);

    expect(signature).toHaveProperty('r');
    expect(signature).toHaveProperty('s');
    expect(signature.r).toBeInstanceOf(Uint8Array);
    expect(signature.s).toBeInstanceOf(Uint8Array);
  });

  it('should produce verifiable signatures', async () => {
    const signer = new PrivateKeySigner(testPrivateKey);
    const pubKey = Felt252(await signer.getPubKey());
    const messageHash = Felt252(0xdeadbeefn);

    const signature = await signer.signRaw(messageHash);
    const isValid = verify(pubKey, messageHash, signature);

    expect(isValid).toBe(true);
  });

  it('should sign transaction and return array', async () => {
    const signer = new PrivateKeySigner(testPrivateKey);
    const txHash = Felt252(0x12345n);

    const signature = await signer.signTransaction(txHash);

    expect(Array.isArray(signature)).toBe(true);
    expect(signature.length).toBe(2);
    expect(typeof signature[0]).toBe('bigint');
    expect(typeof signature[1]).toBe('bigint');
  });
});

describe('createSigner', () => {
  it('should create PrivateKeySigner', () => {
    const signer = createSigner('0x1234');
    expect(signer).toBeInstanceOf(PrivateKeySigner);
  });
});

// ============ Account Tests ============

describe('Account', () => {
  // Mock provider
  const createMockProvider = () => ({
    request: mock(async ({ method, params }: { method: string; params: unknown[] }) => {
      switch (method) {
        case 'starknet_chainId':
          return '0x534e5f5345504f4c4941'; // SN_SEPOLIA
        case 'starknet_getNonce':
          return '0x5'; // nonce = 5
        case 'starknet_addInvokeTransaction':
          return { transaction_hash: '0xabc123' };
        case 'starknet_addDeclareTransaction':
          return { transaction_hash: '0xdef456', class_hash: '0x789' };
        case 'starknet_addDeployAccountTransaction':
          return { transaction_hash: '0xghi789', contract_address: '0x999' };
        case 'starknet_estimateFee':
          return [
            {
              gas_consumed: '0x100',
              gas_price: '0x10',
              data_gas_consumed: '0x50',
              data_gas_price: '0x5',
              overall_fee: '0x1500',
              unit: 'WEI',
            },
          ];
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    }),
  });

  // Test private key - must be < FIELD_PRIME
  const testPrivateKey =
    '0x123456789abcdef123456789abcdef123456789abcdef1234';
  const testAddress =
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678';

  it('should create account instance', () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    expect(account.address).toBe(testAddress);
  });

  it('should get chain ID', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const chainId = await account.getChainId();
    expect(chainId).toBe('0x534e5f5345504f4c4941');
    expect(provider.request).toHaveBeenCalledWith({
      method: 'starknet_chainId',
      params: [],
    });
  });

  it('should cache chain ID', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    await account.getChainId();
    await account.getChainId();

    // Should only call once (cached)
    expect(provider.request).toHaveBeenCalledTimes(1);
  });

  it('should get nonce', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const nonce = await account.getNonce();
    expect(nonce).toBe(5n);
    expect(provider.request).toHaveBeenCalledWith({
      method: 'starknet_getNonce',
      params: ['pending', testAddress],
    });
  });

  it('should execute calls', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const call: Call = {
      contractAddress: '0x1234',
      entrypoint: 'transfer',
      calldata: [0x5678n, 100n],
    };

    const result = await account.execute(call);

    expect(result).toHaveProperty('transaction_hash');
    expect(result.transaction_hash).toBe('0xabc123');
  });

  it('should execute multiple calls', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const calls: Call[] = [
      { contractAddress: '0x1234', entrypoint: 'transfer', calldata: [100n] },
      { contractAddress: '0x5678', entrypoint: 'approve', calldata: [200n] },
    ];

    const result = await account.execute(calls);
    expect(result.transaction_hash).toBe('0xabc123');
  });

  it('should use provided nonce', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const call: Call = {
      contractAddress: '0x1234',
      entrypoint: 'transfer',
      calldata: [100n],
    };

    await account.execute(call, { nonce: 10n });

    // Should not call getNonce since we provided it
    const getNonceCalls = (provider.request as any).mock.calls.filter(
      (c: any) => c[0].method === 'starknet_getNonce'
    );
    expect(getNonceCalls.length).toBe(0);
  });

  it('should estimate invoke fee', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const call: Call = {
      contractAddress: '0x1234',
      entrypoint: 'transfer',
      calldata: [100n],
    };

    const fee = await account.estimateInvokeFee(call);

    expect(fee).toHaveProperty('gas_consumed');
    expect(fee).toHaveProperty('overall_fee');
    expect(fee.unit).toBe('WEI');
  });

  it('should sign typed data', async () => {
    const provider = createMockProvider();
    const signer = createSigner(testPrivateKey);
    const account = new Account(provider as any, testAddress, signer);

    const typedData: TypedData = {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'felt' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        Message: [{ name: 'message', type: 'felt' }],
      },
      primaryType: 'Message',
      domain: {
        name: 'Test',
        version: '1',
        chainId: '0x534e5f5345504f4c4941',
      },
      message: {
        message: '0x1234',
      },
    };

    const signature = await account.signMessage(typedData);

    expect(Array.isArray(signature)).toBe(true);
    expect(signature.length).toBe(2);
  });
});

describe('createAccount', () => {
  it('should create Account instance', () => {
    const provider = { request: async () => {} };
    const signer = createSigner('0x1234');
    const account = createAccount(provider as any, '0xabcd', signer);

    expect(account).toBeInstanceOf(Account);
  });
});

// ============ WalletAccount Tests ============

describe('WalletAccount', () => {
  // Fake wallet provider
  const createFakeWalletProvider = () => {
    const listeners: Map<string, Set<Function>> = new Map();

    return {
      request: mock(async ({ type, params }: { type: string; params?: unknown }) => {
        switch (type) {
          case WalletRequestType.STARKNET_ADD_INVOKE_TRANSACTION:
            return { transaction_hash: '0xwallet_invoke_hash' };
          case WalletRequestType.STARKNET_ADD_DECLARE_TRANSACTION:
            return {
              transaction_hash: '0xwallet_declare_hash',
              class_hash: '0xwallet_class',
            };
          case WalletRequestType.STARKNET_ADD_DEPLOY_ACCOUNT_TRANSACTION:
            return {
              transaction_hash: '0xwallet_deploy_hash',
              contract_address: '0xwallet_address',
            };
          case WalletRequestType.STARKNET_SIGN_TYPED_DATA:
            return ['0x123', '0x456']; // [r, s] as hex
          case WalletRequestType.WALLET_REQUEST_ACCOUNTS:
            return ['0xaccount1', '0xaccount2'];
          case WalletRequestType.WALLET_GET_PERMISSIONS:
            return ['accounts'];
          case WalletRequestType.STARKNET_SUPPORTED_SPECS:
            return ['0.6.0', '0.7.0'];
          default:
            throw new Error(`Unknown wallet request: ${type}`);
        }
      }),
      on: mock((event: string, handler: Function) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(handler);
      }),
      off: mock((event: string, handler: Function) => {
        listeners.get(event)?.delete(handler);
      }),
    };
  };

  const createMockProvider = () => ({
    request: mock(async () => '0x534e5f5345504f4c4941'),
  });

  const testAddress = '0xwallet_account_address';

  it('should create WalletAccount', () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    expect(account).toBeInstanceOf(WalletAccount);
    expect(account.address).toBe(testAddress);
  });

  it('should execute through wallet', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const call: Call = {
      contractAddress: '0x1234',
      entrypoint: 'transfer',
      calldata: [100n],
    };

    const result = await account.execute(call);

    expect(result.transaction_hash).toBe('0xwallet_invoke_hash');
    expect(walletProvider.request).toHaveBeenCalledWith({
      type: WalletRequestType.STARKNET_ADD_INVOKE_TRANSACTION,
      params: expect.any(Object),
    });
  });

  it('should declare through wallet', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const result = await account.declare({
      contract: { abi: [] },
      compiledClassHash: '0xcompiled',
      classHash: '0xclass',
    });

    expect(result.transaction_hash).toBe('0xwallet_declare_hash');
    expect(result.class_hash).toBe('0xwallet_class');
  });

  it('should deploy account through wallet', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const result = await account.deployAccount({
      classHash: '0xclass',
      constructorCalldata: [1n, 2n],
      addressSalt: '0xsalt',
    });

    expect(result.transaction_hash).toBe('0xwallet_deploy_hash');
    expect(result.contract_address).toBe('0xwallet_address');
  });

  it('should sign message through wallet', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const typedData: TypedData = {
      types: { Message: [{ name: 'x', type: 'felt' }] },
      primaryType: 'Message',
      domain: {},
      message: { x: '0x1' },
    };

    const signature = await account.signMessage(typedData);

    expect(Array.isArray(signature)).toBe(true);
    expect(signature.length).toBe(2);
  });

  it('should request accounts', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const accounts = await account.requestAccounts();
    expect(accounts).toEqual(['0xaccount1', '0xaccount2']);
  });

  it('should get permissions', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const permissions = await account.getPermissions();
    expect(permissions).toEqual(['accounts']);
  });

  it('should get supported specs', async () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const specs = await account.getSupportedSpecs();
    expect(specs).toEqual(['0.6.0', '0.7.0']);
  });

  it('should handle account change events', () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const callback = mock(() => {});
    account.onAccountChange(callback);

    // Verify listener was added
    expect(walletProvider.on).toHaveBeenCalledWith(
      'accountsChanged',
      expect.any(Function)
    );
  });

  it('should handle network change events', () => {
    const provider = createMockProvider();
    const walletProvider = createFakeWalletProvider();
    const account = new WalletAccount(
      provider as any,
      walletProvider,
      testAddress
    );

    const callback = mock(() => {});
    account.onNetworkChanged(callback);

    expect(walletProvider.on).toHaveBeenCalledWith(
      'networkChanged',
      expect.any(Function)
    );
  });
});

describe('createWalletAccount', () => {
  it('should create WalletAccount instance', () => {
    const provider = { request: async () => {} };
    const walletProvider = {
      request: async () => {},
      on: () => {},
      off: () => {},
    };

    const account = createWalletAccount(
      provider as any,
      walletProvider as any,
      '0xabcd'
    );

    expect(account).toBeInstanceOf(WalletAccount);
  });
});
