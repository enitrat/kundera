#!/usr/bin/env node
/**
 * kdex - A cast-like CLI for Starknet using Kundera Effect
 *
 * Demo project showing how to integrate kundera-effect in a CLI application.
 */

import { Command } from "commander";
import { loadWasmCrypto } from "@kundera-sn/kundera-ts";
import { blockNumber } from "./commands/blockNumber.js";
import { chainId } from "./commands/chainId.js";
import { balance } from "./commands/balance.js";
import { tx, txStatus, txReceipt } from "./commands/tx.js";
import { block, blockHashAndNumber } from "./commands/block.js";
import { nonce } from "./commands/nonce.js";
import { classHash } from "./commands/classHash.js";
import { storage } from "./commands/storage.js";
import type { Network } from "./config.js";

// Initialize WASM crypto at startup (required for ABI encoding)
await loadWasmCrypto();

const program = new Command();

program
  .name("kdex")
  .description("A cast-like CLI for Starknet using Kundera Effect")
  .version("0.0.1");

// Global network option
program
  .option("-n, --network <network>", "Network to use (mainnet, sepolia)", "mainnet");

// block-number: Get the current block number
program
  .command("block-number")
  .description("Get the current block number")
  .action(async () => {
    const opts = program.opts();
    await blockNumber(opts.network as Network);
  });

// chain-id: Get the chain ID
program
  .command("chain-id")
  .description("Get the chain ID")
  .action(async () => {
    const opts = program.opts();
    await chainId(opts.network as Network);
  });

// balance: Get token balance
program
  .command("balance")
  .description("Get STRK or ETH balance of an address")
  .argument("<address>", "Contract address to check balance for")
  .option("-t, --token <token>", "Token to check (ETH, STRK)", "STRK")
  .action(async (address, options) => {
    const opts = program.opts();
    await balance(address, options.token, opts.network as Network);
  });

// nonce: Get account nonce
program
  .command("nonce")
  .description("Get the nonce of an account")
  .argument("<address>", "Account address")
  .action(async (address) => {
    const opts = program.opts();
    await nonce(address, opts.network as Network);
  });

// tx: Get transaction by hash
program
  .command("tx")
  .description("Get transaction details by hash")
  .argument("<hash>", "Transaction hash")
  .action(async (hash) => {
    const opts = program.opts();
    await tx(hash, opts.network as Network);
  });

// tx-status: Get transaction status
program
  .command("tx-status")
  .description("Get transaction status by hash")
  .argument("<hash>", "Transaction hash")
  .action(async (hash) => {
    const opts = program.opts();
    await txStatus(hash, opts.network as Network);
  });

// tx-receipt: Get transaction receipt
program
  .command("tx-receipt")
  .description("Get transaction receipt by hash")
  .argument("<hash>", "Transaction hash")
  .action(async (hash) => {
    const opts = program.opts();
    await txReceipt(hash, opts.network as Network);
  });

// block: Get block information
program
  .command("block")
  .description("Get block information")
  .argument("[block-id]", "Block number, hash, or 'latest'/'pending'")
  .option("-f, --full", "Include full transaction details")
  .action(async (blockId, options) => {
    const opts = program.opts();
    await block(blockId, options, opts.network as Network);
  });

// block-hash: Get latest block hash and number
program
  .command("block-hash")
  .description("Get the latest block hash and number")
  .action(async () => {
    const opts = program.opts();
    await blockHashAndNumber(opts.network as Network);
  });

// class-hash: Get class hash at address
program
  .command("class-hash")
  .description("Get the class hash of a contract")
  .argument("<address>", "Contract address")
  .action(async (address) => {
    const opts = program.opts();
    await classHash(address, opts.network as Network);
  });

// storage: Get storage at address
program
  .command("storage")
  .description("Get storage value at a contract address")
  .argument("<address>", "Contract address")
  .argument("<key>", "Storage key (felt)")
  .action(async (address, key) => {
    const opts = program.opts();
    await storage(address, key, opts.network as Network);
  });

program.parse();
