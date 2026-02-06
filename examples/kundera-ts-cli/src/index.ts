#!/usr/bin/env node
import { Command } from "commander";
import { getProvider, type Network } from "./config.js";
import { blockNumber } from "./commands/blockNumber.js";
import { chainId } from "./commands/chainId.js";
import { blockHash } from "./commands/blockHash.js";
import { block } from "./commands/block.js";
import { balance } from "./commands/balance.js";
import { nonce } from "./commands/nonce.js";
import { classHash } from "./commands/classHash.js";
import { storage } from "./commands/storage.js";
import { tx, txStatus, txReceipt } from "./commands/tx.js";

const program = new Command();

program
  .name("kundera-ts-cli")
  .description("cast-like Starknet CLI using kundera-ts")
  .version("0.0.1")
  .option("-n, --network <network>", "network to use", "mainnet");

function getProviderFromOpts(opts: { network: string }) {
  return getProvider(opts.network as Network);
}

function handleError(error: unknown): never {
  // FEEDBACK: Provider API doc says errors are "thrown exceptions with code and message".
  // In practice, JSON-RPC errors are thrown as plain objects { code, message }, NOT
  // Error instances. So `error instanceof Error` fails. Had to add plain-object check.
  if (error instanceof Error) {
    const rpcErr = error as Error & { code?: number };
    if (rpcErr.code !== undefined) {
      console.error(`RPC Error ${rpcErr.code}: ${rpcErr.message}`);
    } else {
      console.error(`Error: ${rpcErr.message}`);
    }
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  ) {
    const rpcErr = error as { code: number; message: string };
    console.error(`RPC Error ${rpcErr.code}: ${rpcErr.message}`);
  } else {
    console.error("Unknown error:", error);
  }
  process.exit(1);
}

program
  .command("block-number")
  .description("Get current block number")
  .action(async (_, cmd) => {
    const opts = cmd.optsWithGlobals();
    await blockNumber(getProviderFromOpts(opts)).catch(handleError);
  });

program
  .command("chain-id")
  .description("Get chain ID")
  .action(async (_, cmd) => {
    const opts = cmd.optsWithGlobals();
    await chainId(getProviderFromOpts(opts)).catch(handleError);
  });

program
  .command("block-hash")
  .description("Get current block hash and number")
  .action(async (_, cmd) => {
    const opts = cmd.optsWithGlobals();
    await blockHash(getProviderFromOpts(opts)).catch(handleError);
  });

program
  .command("block [block-id]")
  .description("Get block info (number, hash, or 'latest')")
  .option("-f, --full", "include full transaction details")
  .action(async (blockId, cmdOpts, cmd) => {
    const opts = cmd.optsWithGlobals();
    await block(getProviderFromOpts(opts), blockId, cmdOpts.full).catch(
      handleError,
    );
  });

program
  .command("balance <address>")
  .description("Get token balance")
  .option("-t, --token <token>", "token symbol (ETH, STRK)", "STRK")
  .action(async (address, cmdOpts, cmd) => {
    const opts = cmd.optsWithGlobals();
    await balance(getProviderFromOpts(opts), address, cmdOpts.token).catch(
      handleError,
    );
  });

program
  .command("nonce <address>")
  .description("Get account nonce")
  .action(async (address, _, cmd) => {
    const opts = cmd.optsWithGlobals();
    await nonce(getProviderFromOpts(opts), address).catch(handleError);
  });

program
  .command("class-hash <address>")
  .description("Get class hash at address")
  .action(async (address, _, cmd) => {
    const opts = cmd.optsWithGlobals();
    await classHash(getProviderFromOpts(opts), address).catch(handleError);
  });

program
  .command("storage <address> <key>")
  .description("Get storage value at key")
  .action(async (address, key, _, cmd) => {
    const opts = cmd.optsWithGlobals();
    await storage(getProviderFromOpts(opts), address, key).catch(handleError);
  });

program
  .command("tx <hash>")
  .description("Get transaction details")
  .action(async (hash, _, cmd) => {
    const opts = cmd.optsWithGlobals();
    await tx(getProviderFromOpts(opts), hash).catch(handleError);
  });

program
  .command("tx-status <hash>")
  .description("Get transaction status")
  .action(async (hash, _, cmd) => {
    const opts = cmd.optsWithGlobals();
    await txStatus(getProviderFromOpts(opts), hash).catch(handleError);
  });

program
  .command("tx-receipt <hash>")
  .description("Get transaction receipt")
  .action(async (hash, _, cmd) => {
    const opts = cmd.optsWithGlobals();
    await txReceipt(getProviderFromOpts(opts), hash).catch(handleError);
  });

program.parse();
