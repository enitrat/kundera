#!/usr/bin/env node
import { Command } from "commander";
import type { Network } from "./config.js";
import { parseNetwork } from "./config.js";
import { runCommand } from "./runtime.js";
import { formatError } from "./utils.js";
import { blockNumber } from "./commands/blockNumber.js";
import { chainId } from "./commands/chainId.js";
import { blockHash } from "./commands/blockHash.js";
import { block } from "./commands/block.js";
import { balance } from "./commands/balance.js";
import { nonce } from "./commands/nonce.js";
import { classHash } from "./commands/classHash.js";
import { storage } from "./commands/storage.js";
import { tx, txStatus, txReceipt } from "./commands/tx.js";

type GlobalOpts = {
  network: string;
};

function getNetwork(opts: GlobalOpts): Network {
  try {
    return parseNetwork(opts.network);
  } catch (error) {
    console.error(formatError(error));
    process.exit(1);
  }
}

const program = new Command();

program
  .name("kundera-effect-cli")
  .description("cast-like Starknet CLI using kundera-effect")
  .version("0.0.1")
  .option("-n, --network <network>", "network to use", "mainnet");

program
  .command("block-number")
  .description("Get current block number")
  .action(async (_, cmd) => {
    await runCommand(blockNumber, getNetwork(cmd.optsWithGlobals() as GlobalOpts));
  });

program
  .command("chain-id")
  .description("Get chain ID")
  .action(async (_, cmd) => {
    await runCommand(chainId, getNetwork(cmd.optsWithGlobals() as GlobalOpts));
  });

program
  .command("block-hash")
  .description("Get current block hash and number")
  .action(async (_, cmd) => {
    await runCommand(blockHash, getNetwork(cmd.optsWithGlobals() as GlobalOpts));
  });

program
  .command("block [block-id]")
  .description("Get block info (number, hash, latest, pending)")
  .option("-f, --full", "include full transaction details")
  .action(async (blockId, cmdOpts, cmd) => {
    await runCommand(
      block(blockId, cmdOpts.full),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program
  .command("balance <address>")
  .description("Get token balance")
  .option("-t, --token <token>", "token symbol (ETH, STRK)", "STRK")
  .action(async (address, cmdOpts, cmd) => {
    await runCommand(
      balance(address, cmdOpts.token),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program
  .command("nonce <address>")
  .description("Get account nonce")
  .action(async (address, _, cmd) => {
    await runCommand(
      nonce(address),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program
  .command("class-hash <address>")
  .description("Get class hash at address")
  .action(async (address, _, cmd) => {
    await runCommand(
      classHash(address),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program
  .command("storage <address> <key>")
  .description("Get storage value at key")
  .action(async (address, key, _, cmd) => {
    await runCommand(
      storage(address, key),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program
  .command("tx <hash>")
  .description("Get transaction details")
  .action(async (hash, _, cmd) => {
    await runCommand(tx(hash), getNetwork(cmd.optsWithGlobals() as GlobalOpts));
  });

program
  .command("tx-status <hash>")
  .description("Get transaction status")
  .action(async (hash, _, cmd) => {
    await runCommand(
      txStatus(hash),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program
  .command("tx-receipt <hash>")
  .description("Get transaction receipt")
  .action(async (hash, _, cmd) => {
    await runCommand(
      txReceipt(hash),
      getNetwork(cmd.optsWithGlobals() as GlobalOpts),
    );
  });

program.parse();
