/**
 * RPC Schema Type System
 *
 * Type-safe RPC schema for defining JSON-RPC methods, parameters, and return types.
 * Enables compile-time validation of method calls and return values.
 *
 * @module provider/RpcSchema
 */

/**
 * Base RPC schema type
 */
export type RpcSchema = readonly {
  Method: string;
  Parameters?: unknown;
  ReturnType: unknown;
}[];

/**
 * Extract method names from schema
 */
export type RpcMethodNames<TSchema extends RpcSchema> =
  TSchema[number]['Method'];

/**
 * Extract parameters for specific method
 */
export type RpcMethodParameters<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> = Extract<TSchema[number], { Method: TMethod }>['Parameters'];

/**
 * Extract return type for specific method
 */
export type RpcMethodReturnType<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> = Extract<TSchema[number], { Method: TMethod }>['ReturnType'];
