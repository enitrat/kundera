/**
 * kdex balance command
 *
 * Get STRK or ETH balance of an address using typed contract calls.
 *
 * This command showcases kundera-effect's ContractRegistryService feature which
 * provides pre-configured contract instances in a Layer for cleaner Effect composition.
 */

import { Effect } from "effect";
import { Services } from "@kundera-sn/kundera-effect";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import {
  ERC20_ABI,
  TOKEN_ADDRESSES,
  type Token,
  type Network,
} from "../config.js";
import { AddressValidationError } from "../errors.js";

// Type alias for contract instance
type ERC20Contract = Services.Contract.ContractInstance<typeof ERC20_ABI>;

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
 * Uses ContractRegistryService for pre-configured contract instances:
 * - Contracts are defined in ContractsLayer (see config.ts)
 * - No inline contract creation - cleaner Effect.gen
 * - TypeScript enforces correct argument types via abi-wan-kanabi
 */
export const balance = (address: string, token: Token, _network: Network) =>
  Effect.gen(function* () {
    // Validate inputs
    const accountAddress = yield* parseAddress(address);

    yield* Effect.annotateCurrentSpan({
      "kdex.command": "balance",
      "kdex.token": token,
      "kdex.network": _network,
      "kdex.address": address,
    });

    // Get pre-configured contracts from registry
    const contracts = yield* Services.Contract.ContractRegistryService;

    // Select the token contract (ETH or STRK)
    const tokenContract = contracts[token] as ERC20Contract;

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
 * This shows the alternative approach without ContractRegistryService.
 * Useful when you need more control over the call parameters.
 */
export const balanceLowLevel = (
  address: string,
  token: Token,
  network: Network
) =>
  Effect.gen(function* () {
    const accountAddress = yield* parseAddress(address);
    const tokenAddress = TOKEN_ADDRESSES[network][token];

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
