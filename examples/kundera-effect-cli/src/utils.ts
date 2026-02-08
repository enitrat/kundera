import * as ParseResult from "effect/ParseResult";

export function formatError(error: unknown): string {
  // Effect ParseError (extends Error with _tag)
  if (error instanceof Error && "_tag" in error && error._tag === "ParseError") {
    return ParseResult.TreeFormatter.formatErrorSync(
      error as ParseResult.ParseError,
    );
  }

  // Data.TaggedError instances (also extend Error)
  if (error && typeof error === "object" && "_tag" in error) {
    const tagged = error as {
      _tag?: unknown;
      message?: unknown;
      operation?: unknown;
    };
    const tag = typeof tagged._tag === "string" ? tagged._tag : "Error";
    const message =
      typeof tagged.message === "string"
        ? tagged.message
        : "Unknown effect failure";
    const operation =
      typeof tagged.operation === "string" ? ` [${tagged.operation}]` : "";

    return `${tag}${operation}: ${message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function toPrettyJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
}

export function decodeChainIdHex(chainId: string): string | null {
  if (!chainId.startsWith("0x")) {
    return null;
  }

  const hex = chainId.slice(2);
  if (hex.length % 2 !== 0) {
    return null;
  }

  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      return null;
    }
    if (byte !== 0) {
      out += String.fromCharCode(byte);
    }
  }

  return /^[\x20-\x7E]+$/.test(out) ? out : null;
}

export function formatTokenAmount(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const abs = value < 0n ? -value : value;
  const whole = abs / divisor;
  const frac = abs % divisor;
  const formatted = `${whole}.${frac.toString().padStart(decimals, "0").slice(0, 6)}`;
  return value < 0n ? `-${formatted}` : formatted;
}
