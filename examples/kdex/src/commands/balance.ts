/**
 * kdex balance command
 *
 * Get STRK or ETH balance of an address using typed contract calls.
 *
 * This command showcases kundera-effect's ContractFactory feature which provides
 * fully typed contract interactions via abi-wan-kanabi integration.
 */

import { Effect } from "effect";
import { Services } from "@kundera-sn/kundera-effect";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import {
  TransportService,
  TOKEN_ADDRESSES,
  type Token,
  type Network,
} from "../config.js";
import { AddressValidationError, TokenNotFoundError } from "../errors.js";

// -----------------------------------------------------------------------------
// ERC20 ABI (typed with `as const` for full type inference)
// -----------------------------------------------------------------------------

/**
 * Minimal ERC20 ABI for balance queries.
 * The `as const` assertion enables abi-wan-kanabi type inference.
 */
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "core::integer::u8" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
] as const;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Format a balance value with decimals for display
 */
const formatBalance = Effect.fn("kdex.formatBalance")(function* (
  value: bigint,
  decimals: number
) {
  const divisor = 10n ** BigInt(decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const truncatedFractional =
    fractionalStr.slice(0, 6).replace(/0+$/, "") || "0";

  return `${integerPart}.${truncatedFractional}`;
});

/**
 * Get token address for network, failing with TokenNotFoundError if not found
 */
const getTokenAddress = Effect.fn("kdex.getTokenAddress")(function* (
  token: Token,
  network: Network
) {
  const addresses = TOKEN_ADDRESSES[network];
  const address = addresses[token];

  if (!address) {
    return yield* Effect.fail(
      new TokenNotFoundError({
        token,
        network,
        message: `Token ${token} not configured for network ${network}`,
      })
    );
  }

  return address;
});

/**
 * Validate and parse a contract address
 */
const parseAddress = Effect.fn("kdex.parseAddress")(function* (
  address: string
) {
  return yield* ContractAddress.from(address).pipe(
    Effect.mapError(
      (error) =>
        new AddressValidationError({
          address,
          message: `Invalid address: ${error.message}`,
          cause: error,
        })
    )
  );
});

// -----------------------------------------------------------------------------
// Main Command
// -----------------------------------------------------------------------------

/**
 * Get token balance for an address.
 *
 * Uses ContractFactory for fully typed contract calls:
 * - token.read.balanceOf() is typed to accept ContractAddress and return bigint
 * - No manual ABI encoding/decoding required
 * - TypeScript enforces correct argument types
 */
export const balance = (address: string, token: Token, network: Network) =>
  Effect.gen(function* () {
    // Validate inputs
    const accountAddress = yield* parseAddress(address);
    const tokenAddress = yield* getTokenAddress(token, network);

    yield* Effect.annotateCurrentSpan({
      "kdex.command": "balance",
      "kdex.token": token,
      "kdex.network": network,
      "kdex.address": address,
    });

    // Create typed contract instance using ContractFactory
    // This is the key feature: fully typed read.balanceOf() method
    const tokenContract = yield* Services.Contract.Contract(
      tokenAddress,
      ERC20_ABI
    );

    // Call balanceOf with typed arguments
    // The return type is automatically inferred as bigint from the ABI
    const rawBalance = yield* tokenContract.read.balanceOf(
      accountAddress.toHex()
    );

    // Convert to bigint (ContractFactory returns the decoded value)
    const balanceValue =
      typeof rawBalance === "bigint" ? rawBalance : BigInt(String(rawBalance));

    // Format and log result
    const formatted = yield* formatBalance(balanceValue, 18);

    yield* Effect.log(`${formatted} ${token}`, {
      balance: balanceValue.toString(),
      token,
      address,
    });

    return balanceValue;
  }).pipe(Effect.withSpan("kdex.balance"));

// -----------------------------------------------------------------------------
// Alternative: Low-level balance query (for comparison)
// -----------------------------------------------------------------------------

/**
 * Get balance using low-level ContractService.readContract
 *
 * This shows the alternative approach without ContractFactory.
 * Useful when you need more control over the call parameters.
 */
export const balanceLowLevel = (
  address: string,
  token: Token,
  network: Network
) =>
  Effect.gen(function* () {
    const accountAddress = yield* parseAddress(address);
    const tokenAddress = yield* getTokenAddress(token, network);

    const contract = yield* Services.Contract.ContractService;

    const result = yield* contract.readContract({
      abi: ERC20_ABI as unknown as import("@kundera-sn/kundera-ts/abi").Abi,
      address: tokenAddress,
      functionName: "balanceOf",
      args: [accountAddress.toHex()],
      blockId: "latest",
    });

    const balanceValue =
      typeof result === "bigint" ? result : BigInt(String(result));

    const formatted = yield* formatBalance(balanceValue, 18);
    yield* Effect.log(`${formatted} ${token}`);

    return balanceValue;
  }).pipe(Effect.withSpan("kdex.balanceLowLevel"));
