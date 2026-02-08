/**
 * Factory for RPC ↔ domain Schema.transformOrFail bridges.
 *
 * Trust boundary: RPC input schemas use Schema.Unknown because kundera-ts wire
 * types are plain TS interfaces, not Effect Schemas. Validation is performed by
 * the fromRpc() converter, which throws on invalid input.
 *
 * @internal
 */
import type * as AST from "effect/SchemaAST";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/**
 * Creates an unvalidated Schema placeholder for an RPC wire type.
 * The cast is safe because all real validation happens inside
 * `rpcTransform`'s decode via the kundera-ts fromRpc() converter.
 */
export const rpcSchema = <T>(): Schema.Schema<T> => Schema.Unknown as Schema.Schema<T>;

/**
 * Creates a Schema.transformOrFail that delegates decode/encode to kundera-ts
 * fromRpc/toRpc converters. Replaces the 22-line boilerplate with a one-liner.
 *
 * @param declareSchema - Schema.declare for the domain type (structural guard)
 * @param fromRpc - kundera-ts converter: wire → domain
 * @param toRpc - kundera-ts converter: domain → wire
 * @param annotations - identifier, title, description, error message
 */
export const rpcTransform = <Domain, Wire>(
  declareSchema: Schema.Schema<Domain>,
  fromRpc: (wire: Wire) => Domain,
  toRpc: (domain: Domain) => Wire,
  annotations: {
    readonly identifier: string;
    readonly title: string;
    readonly description: string;
    readonly errorMessage: string;
  },
): Schema.Schema<Domain, Wire> =>
  Schema.transformOrFail(rpcSchema<Wire>(), declareSchema, {
    strict: true,
    decode: (value: Wire, _: unknown, ast: AST.AST) => {
      try {
        return ParseResult.succeed(fromRpc(value));
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(
            ast,
            value,
            error instanceof Error ? error.message : annotations.errorMessage,
          ),
        );
      }
    },
    encode: (value: Domain) => ParseResult.succeed(toRpc(value)),
  }).annotations({
    identifier: annotations.identifier,
    title: annotations.title,
    description: annotations.description,
    message: () => annotations.errorMessage,
  });
