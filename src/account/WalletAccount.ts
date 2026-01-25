/**
 * WalletAccount Class
 *
 * Account wrapper for browser wallet integrations (Argent, Braavos, etc.)
 * Routes signing operations through the wallet provider.
 *
 * @module account/WalletAccount
 */

import { Account } from './Account.js';
import type { Provider } from '../provider/Provider.js';
import type { SignerInterface } from './Signer.js';
import type { Signature } from '../crypto/index.js';
import { Felt252, toBigInt, toHex, type Felt252Input } from '../primitives/index.js';
import type {
  Call,
  UniversalDetails,
  DeclarePayload,
  DeployAccountPayload,
  ExecuteResult,
  DeclareResult,
  DeployAccountResult,
  TypedData,
  SignatureArray,
} from './types.js';

// ============ Wallet Provider Interface ============

/**
 * Starknet wallet provider interface (get-starknet compatible)
 */
export interface StarknetWalletProvider {
  /**
   * Request method for wallet operations
   */
  request(args: WalletRequest): Promise<unknown>;

  /**
   * Add event listener
   */
  on(event: string, handler: WalletEventHandler): void;

  /**
   * Remove event listener
   */
  off(event: string, handler: WalletEventHandler): void;
}

/**
 * Wallet request types
 */
export interface WalletRequest {
  type: string;
  params?: unknown;
}

/**
 * Wallet event handler
 */
export type WalletEventHandler = (...args: unknown[]) => void;

// ============ Wallet Request Types ============

/**
 * Request types for Starknet wallet API
 */
export const WalletRequestType = {
  WALLET_GET_PERMISSIONS: 'wallet_getPermissions',
  WALLET_REQUEST_ACCOUNTS: 'wallet_requestAccounts',
  WALLET_WATCH_ASSET: 'wallet_watchAsset',
  WALLET_ADD_STARKNET_CHAIN: 'wallet_addStarknetChain',
  WALLET_SWITCH_STARKNET_CHAIN: 'wallet_switchStarknetChain',
  WALLET_REQUEST_CHAIN_ID: 'wallet_requestChainId',
  WALLET_DEPLOYMENT_DATA: 'wallet_deploymentData',
  STARKNET_ADD_INVOKE_TRANSACTION: 'starknet_addInvokeTransaction',
  STARKNET_ADD_DECLARE_TRANSACTION: 'starknet_addDeclareTransaction',
  STARKNET_ADD_DEPLOY_ACCOUNT_TRANSACTION: 'starknet_addDeployAccountTransaction',
  STARKNET_SIGN_TYPED_DATA: 'starknet_signTypedData',
  STARKNET_SUPPORTED_SPECS: 'starknet_supportedSpecs',
} as const;

// ============ WalletAccount Signer ============

/**
 * Signer that delegates to wallet provider
 */
class WalletSigner implements SignerInterface {
  private readonly walletProvider: StarknetWalletProvider;
  private readonly accountAddress: string;

  constructor(walletProvider: StarknetWalletProvider, accountAddress: string) {
    this.walletProvider = walletProvider;
    this.accountAddress = accountAddress;
  }

  async getPubKey(): Promise<string> {
    // Wallet providers don't typically expose public key directly
    // Return empty - the wallet handles signing internally
    throw new Error('WalletSigner does not expose public key');
  }

  async signRaw(_hash: Felt252Input): Promise<Signature> {
    // Wallet providers don't support raw signing
    throw new Error('WalletSigner does not support raw signing - use signMessage or signTransaction');
  }

  async signMessage(
    typedData: TypedData,
    accountAddress: string
  ): Promise<SignatureArray> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.STARKNET_SIGN_TYPED_DATA,
      params: {
        typedData,
        accountAddress,
      },
    });

    // Result is typically [r, s] as hex strings
    const sig = result as string[];
    return sig.map((s) => toBigInt(Felt252(s)));
  }

  async signTransaction(_hash: Felt252Input): Promise<SignatureArray> {
    // Wallet handles transaction signing internally during execute
    throw new Error(
      'WalletSigner does not support separate transaction signing - ' +
        'use WalletAccount.execute which routes through wallet'
    );
  }
}

// ============ WalletAccount Class ============

/**
 * Account wrapper for browser wallet integrations
 *
 * Routes transaction execution through the wallet provider,
 * which handles signing and submission.
 */
export class WalletAccount extends Account {
  /** Wallet provider for browser wallets */
  readonly walletProvider: StarknetWalletProvider;

  /**
   * Create a WalletAccount
   * @param provider - JSON-RPC provider for read operations
   * @param walletProvider - Starknet wallet provider (from get-starknet)
   * @param address - Account address
   */
  constructor(
    provider: Provider,
    walletProvider: StarknetWalletProvider,
    address: string
  ) {
    // Create a wallet signer that delegates to wallet provider
    const signer = new WalletSigner(walletProvider, address);
    super(provider, address, signer);
    this.walletProvider = walletProvider;
  }

  // ============ Execute (Override) ============

  /**
   * Execute calls through wallet provider
   *
   * The wallet handles:
   * - Transaction building
   * - Fee estimation (if needed)
   * - User confirmation
   * - Signing
   * - Submission
   */
  override async execute(
    calls: Call | Call[],
    _details?: UniversalDetails
  ): Promise<ExecuteResult> {
    const callsArray = Array.isArray(calls) ? calls : [calls];

    const result = await this.walletProvider.request({
      type: WalletRequestType.STARKNET_ADD_INVOKE_TRANSACTION,
      params: {
        calls: callsArray.map((call) => ({
          contract_address: call.contractAddress,
          entry_point: call.entrypoint,
          calldata: call.calldata.map((c) => toHex(Felt252(c))),
        })),
      },
    });

    return result as ExecuteResult;
  }

  // ============ Declare (Override) ============

  /**
   * Declare through wallet provider
   */
  override async declare(
    payload: DeclarePayload,
    _details?: UniversalDetails
  ): Promise<DeclareResult> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.STARKNET_ADD_DECLARE_TRANSACTION,
      params: {
        contract_class: payload.contract,
        compiled_class_hash: payload.compiledClassHash,
        class_hash: payload.classHash,
      },
    });

    return result as DeclareResult;
  }

  // ============ Deploy Account (Override) ============

  /**
   * Deploy account through wallet provider
   */
  override async deployAccount(
    payload: DeployAccountPayload,
    _details?: UniversalDetails
  ): Promise<DeployAccountResult> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.STARKNET_ADD_DEPLOY_ACCOUNT_TRANSACTION,
      params: {
        class_hash: payload.classHash,
        constructor_calldata: (payload.constructorCalldata ?? []).map((c) =>
          toHex(Felt252(c))
        ),
        contract_address_salt: payload.addressSalt,
      },
    });

    return result as DeployAccountResult;
  }

  // ============ Sign Message (Override) ============

  /**
   * Sign typed data through wallet provider
   */
  override async signMessage(typedData: TypedData): Promise<SignatureArray> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.STARKNET_SIGN_TYPED_DATA,
      params: {
        typedData,
        accountAddress: this.address,
      },
    });

    const sig = result as string[];
    return sig.map((s) => toBigInt(Felt252(s)));
  }

  // ============ Wallet Events ============

  /**
   * Subscribe to account changes
   */
  onAccountChange(callback: (accounts: string[]) => void): void {
    this.walletProvider.on('accountsChanged', (accounts) => {
      callback(accounts as string[]);
    });
  }

  /**
   * Subscribe to network changes
   */
  onNetworkChanged(callback: (chainId: string) => void): void {
    this.walletProvider.on('networkChanged', (chainId) => {
      callback(chainId as string);
    });
  }

  /**
   * Remove account change listener
   */
  offAccountChange(callback: (accounts: string[]) => void): void {
    this.walletProvider.off('accountsChanged', callback as WalletEventHandler);
  }

  /**
   * Remove network change listener
   */
  offNetworkChanged(callback: (chainId: string) => void): void {
    this.walletProvider.off('networkChanged', callback as WalletEventHandler);
  }

  // ============ Wallet-Specific Methods ============

  /**
   * Request accounts from wallet (triggers connect flow)
   */
  async requestAccounts(): Promise<string[]> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.WALLET_REQUEST_ACCOUNTS,
    });
    return result as string[];
  }

  /**
   * Get current permissions
   */
  async getPermissions(): Promise<string[]> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.WALLET_GET_PERMISSIONS,
    });
    return result as string[];
  }

  /**
   * Request wallet to watch an asset
   */
  async watchAsset(params: {
    type: 'ERC20';
    options: {
      address: string;
      symbol?: string;
      decimals?: number;
      image?: string;
      name?: string;
    };
  }): Promise<boolean> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.WALLET_WATCH_ASSET,
      params,
    });
    return result as boolean;
  }

  /**
   * Request wallet to switch chain
   */
  async switchChain(chainId: string): Promise<boolean> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.WALLET_SWITCH_STARKNET_CHAIN,
      params: { chainId },
    });
    return result as boolean;
  }

  /**
   * Get supported Starknet specs
   */
  async getSupportedSpecs(): Promise<string[]> {
    const result = await this.walletProvider.request({
      type: WalletRequestType.STARKNET_SUPPORTED_SPECS,
    });
    return result as string[];
  }
}

// ============ Factory Function ============

/**
 * Create a WalletAccount from a wallet provider
 * @param provider - JSON-RPC provider
 * @param walletProvider - Starknet wallet provider
 * @param address - Account address
 */
export function createWalletAccount(
  provider: Provider,
  walletProvider: StarknetWalletProvider,
  address: string
): WalletAccount {
  return new WalletAccount(provider, walletProvider, address);
}
