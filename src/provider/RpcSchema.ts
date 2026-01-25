/**
 * RPC Schema Types
 *
 * Type utilities for compile-time type-safe RPC calls.
 * Based on Voltaire's schema system.
 *
 * @module provider/RpcSchema
 */

/**
 * Individual schema entry defining a method's types
 */
export type RpcSchemaEntry = {
  /** Method name */
  Method: string;
  /** Parameter types (tuple) */
  Parameters: readonly unknown[];
  /** Return type */
  ReturnType: unknown;
};

/**
 * RPC Schema is a readonly array of schema entries
 */
export type RpcSchema = readonly RpcSchemaEntry[];

/**
 * Extract method names from schema as a union type
 */
export type RpcMethodNames<TSchema extends RpcSchema> =
  TSchema[number]['Method'];

/**
 * Extract parameters for a specific method
 */
export type RpcMethodParameters<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> = Extract<TSchema[number], { Method: TMethod }>['Parameters'];

/**
 * Extract return type for a specific method
 */
export type RpcMethodReturnType<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> = Extract<TSchema[number], { Method: TMethod }>['ReturnType'];

/**
 * Request arguments with schema typing
 */
export interface SchemaRequestArguments<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> {
  readonly method: TMethod;
  readonly params?: RpcMethodParameters<TSchema, TMethod>;
}

/**
 * EIP-1193-like request function with full type inference from schema
 */
export type EIP1193RequestFn<TSchema extends RpcSchema> = <
  TMethod extends RpcMethodNames<TSchema>,
>(
  args: SchemaRequestArguments<TSchema, TMethod>,
) => Promise<RpcMethodReturnType<TSchema, TMethod>>;
