#!/usr/bin/env node
/**
 * kdex - A cast-like CLI for Starknet using Kundera Effect
 *
 * Demo project showcasing kundera-effect's best features:
 * - ContractRegistryService for pre-configured typed contract instances
 * - Effect.Service pattern for dependency injection
 * - Schema.TaggedError for typed errors
 * - Effect.fn for automatic tracing
 * - Config for validated configuration
 * - Layer composition for testable architecture
 */

import { Command } from "commander";
import { Effect, Layer, Logger, Match } from "effect";
import { loadWasmCrypto } from "@kundera-sn/kundera-ts";
import { Services } from "@kundera-sn/kundera-effect";
import { blockNumber } from "./commands/blockNumber.js";
import { chainId } from "./commands/chainId.js";
import { balance } from "./commands/balance.js";
import { tx, txStatus, txReceipt } from "./commands/tx.js";
import { block, blockHashAndNumber, type BlockOptions } from "./commands/block.js";
import { nonce } from "./commands/nonce.js";
import { classHash } from "./commands/classHash.js";
import { storage } from "./commands/storage.js";
import {
  TransportService,
  TransportLayerOrDie,
  ContractsLayer,
  isValidNetwork,
  type Network,
  type Token,
  TOKENS,
} from "./config.js";
import {
  AddressValidationError,
  BlockIdParseError,
  BlockNotFoundError,
  ClassHashNotFoundError,
  ConfigurationError,
  FeltValidationError,
  StorageReadError,
  TokenNotFoundError,
  TransactionNotFoundError,
} from "./errors.js";

// Initialize WASM crypto at startup (required for ABI encoding)
await loadWasmCrypto();

// -----------------------------------------------------------------------------
// CLI Logger
// -----------------------------------------------------------------------------

/**
 * Custom logger that outputs plain text (no timestamps/levels for CLI)
 */
const CliLogger = Logger.replace(
  Logger.defaultLogger,
  Logger.make(({ message }) => {
    globalThis.console.log(message);
  })
);

// -----------------------------------------------------------------------------
// Error Formatting
// -----------------------------------------------------------------------------

/**
 * Format errors for CLI output using Match for exhaustive handling
 */
const formatError = (error: unknown): string =>
  Match.value(error).pipe(
    Match.when(
      Match.instanceOf(AddressValidationError),
      (e) => `Invalid address "${e.address}": ${e.message}`
    ),
    Match.when(
      Match.instanceOf(FeltValidationError),
      (e) => `Invalid felt "${e.value}": ${e.message}`
    ),
    Match.when(
      Match.instanceOf(TokenNotFoundError),
      (e) => `Token ${e.token} not found on ${e.network}: ${e.message}`
    ),
    Match.when(
      Match.instanceOf(BlockIdParseError),
      (e) => `Invalid block ID "${e.input}": ${e.message}`
    ),
    Match.when(
      Match.instanceOf(TransactionNotFoundError),
      (e) => `Transaction ${e.hash}: ${e.message}`
    ),
    Match.when(
      Match.instanceOf(BlockNotFoundError),
      (e) => `Block ${e.blockId}: ${e.message}`
    ),
    Match.when(
      Match.instanceOf(ClassHashNotFoundError),
      (e) => `Class hash at ${e.address}: ${e.message}`
    ),
    Match.when(
      Match.instanceOf(StorageReadError),
      (e) => `Storage at ${e.address}[${e.key}]: ${e.message}`
    ),
    Match.when(
      Match.instanceOf(ConfigurationError),
      (e) => `Configuration error (${e.key}): ${e.message}`
    ),
    Match.orElse((e) => {
      // Handle other Effect errors and unknown errors
      if (typeof e === "object" && e !== null) {
        const obj = e as Record<string, unknown>;
        if ("_tag" in obj && "message" in obj) {
          return `${obj._tag}: ${obj.message}`;
        }
        if ("message" in obj) {
          return String(obj.message);
        }
      }
      return String(e);
    })
  );

// -----------------------------------------------------------------------------
// Command Runner
// -----------------------------------------------------------------------------

/**
 * Create the application layer for a given network.
 * Composes transport, ContractLayer, and ContractsLayer for pre-configured contracts.
 */
const createAppLayer = (network: Network) =>
  Layer.mergeAll(
    TransportLayerOrDie(network),
    ContractsLayer(network),
    Services.Contract.ContractLayer.pipe(
      Layer.provide(
        Services.Presets.createHttpProvider(
          network === "mainnet"
            ? "https://api.zan.top/public/starknet-mainnet"
            : "https://api.zan.top/public/starknet-sepolia"
        )
      )
    )
  );

/**
 * Run an Effect program with proper layer composition and error handling
 */
const runCommand = <A, E>(
  program: Effect.Effect<A, E, TransportService | Services.Contract.ContractService | Services.Contract.ContractRegistryService>,
  network: Network
): Promise<void> => {
  const layer = createAppLayer(network);

  return Effect.runPromise(
    program.pipe(
      Effect.provide(layer),
      Effect.provide(CliLogger),
      Effect.catchAllDefect((defect) => {
        console.error(`Unexpected error: ${formatError(defect)}`);
        return Effect.sync(() => process.exit(1));
      }),
      Effect.catchAll((error) => {
        console.error(formatError(error));
        return Effect.sync(() => process.exit(1));
      }),
      Effect.asVoid
    )
  );
};

/**
 * Run a simple transport-only command
 */
const runSimpleCommand = <A, E>(
  program: Effect.Effect<A, E, TransportService>,
  network: Network
): Promise<void> => {
  const layer = TransportLayerOrDie(network);

  return Effect.runPromise(
    program.pipe(
      Effect.provide(layer),
      Effect.provide(CliLogger),
      Effect.catchAllDefect((defect) => {
        console.error(`Unexpected error: ${formatError(defect)}`);
        return Effect.sync(() => process.exit(1));
      }),
      Effect.catchAll((error) => {
        console.error(formatError(error));
        return Effect.sync(() => process.exit(1));
      }),
      Effect.asVoid
    )
  );
};

// -----------------------------------------------------------------------------
// CLI Definition
// -----------------------------------------------------------------------------

const program = new Command();

program
  .name("kdex")
  .description(
    "A cast-like CLI for Starknet using Kundera Effect\n\n" +
      "Showcases typed contract calls with Kundera ABI inference, " +
      "Effect services, and proper error handling."
  )
  .version("0.1.0");

// Global network option
program.option(
  "-n, --network <network>",
  "Network to use (mainnet, sepolia)",
  "mainnet"
);

// block-number: Get the current block number
program
  .command("block-number")
  .description("Get the current block number")
  .action(async () => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(blockNumber(), network);
  });

// chain-id: Get the chain ID
program
  .command("chain-id")
  .description("Get the chain ID")
  .action(async () => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(chainId(), network);
  });

// balance: Get token balance (showcases ContractRegistryService)
program
  .command("balance")
  .description(
    "Get STRK or ETH balance of an address\n" +
      "(Uses ContractRegistryService for pre-configured typed contracts)"
  )
  .argument("<address>", "Contract address to check balance for")
  .option("-t, --token <token>", `Token to check (${TOKENS.join(", ")})`, "STRK")
  .action(async (address, options) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    const token = options.token as Token;
    if (!TOKENS.includes(token)) {
      console.error(`Invalid token: ${token}. Use ${TOKENS.join(" or ")}.`);
      process.exit(1);
    }
    await runCommand(balance(address, token, network), network);
  });

// nonce: Get account nonce
program
  .command("nonce")
  .description("Get the nonce of an account")
  .argument("<address>", "Account address")
  .action(async (address) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(nonce(address), network);
  });

// tx: Get transaction by hash
program
  .command("tx")
  .description("Get transaction details by hash")
  .argument("<hash>", "Transaction hash")
  .action(async (hash) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(tx(hash), network);
  });

// tx-status: Get transaction status
program
  .command("tx-status")
  .description("Get transaction status by hash")
  .argument("<hash>", "Transaction hash")
  .action(async (hash) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(txStatus(hash), network);
  });

// tx-receipt: Get transaction receipt
program
  .command("tx-receipt")
  .description("Get transaction receipt by hash")
  .argument("<hash>", "Transaction hash")
  .action(async (hash) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(txReceipt(hash), network);
  });

// block: Get block information
program
  .command("block")
  .description("Get block information")
  .argument("[block-id]", "Block number, hash, or 'latest'/'pending'")
  .option("-f, --full", "Include full transaction details")
  .action(async (blockId, options) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    const blockOptions: BlockOptions = { full: options.full };
    await runSimpleCommand(block(blockId, blockOptions) as any, network);
  });

// block-hash: Get latest block hash and number
program
  .command("block-hash")
  .description("Get the latest block hash and number")
  .action(async () => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(blockHashAndNumber(), network);
  });

// class-hash: Get class hash at address
program
  .command("class-hash")
  .description("Get the class hash of a contract")
  .argument("<address>", "Contract address")
  .action(async (address) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(classHash(address), network);
  });

// storage: Get storage at address
program
  .command("storage")
  .description("Get storage value at a contract address")
  .argument("<address>", "Contract address")
  .argument("<key>", "Storage key (felt)")
  .action(async (address, key) => {
    const opts = program.opts();
    const network = opts.network as string;
    if (!isValidNetwork(network)) {
      console.error(`Invalid network: ${network}. Use 'mainnet' or 'sepolia'.`);
      process.exit(1);
    }
    await runSimpleCommand(storage(address, key), network);
  });

program.parse();
