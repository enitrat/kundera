import * as Schema from "effect/Schema";
import {
  functionInvocationFromRpc,
  functionInvocationToRpc,
  orderedEventFromRpc,
  orderedEventToRpc,
  orderedMessageFromRpc,
  orderedMessageToRpc,
  revertibleFunctionInvocationFromRpc,
  revertibleFunctionInvocationToRpc,
  transactionTraceFromRpc,
  transactionTraceToRpc,
  type FunctionInvocationType,
  type OrderedEventType,
  type OrderedMessageType,
  type RevertibleFunctionInvocationType,
  type TransactionTraceType,
} from "@kundera-sn/kundera-ts";
import { isArrayOf, isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcOrderedEvent = Parameters<typeof orderedEventFromRpc>[0];
type RpcOrderedMessage = Parameters<typeof orderedMessageFromRpc>[0];
type RpcFunctionInvocation = Parameters<typeof functionInvocationFromRpc>[0];
type RpcRevertibleFunctionInvocation = Parameters<typeof revertibleFunctionInvocationFromRpc>[0];
type RpcTransactionTrace = Parameters<typeof transactionTraceFromRpc>[0];

const OrderedEventTypeSchema = Schema.declare<OrderedEventType>(
  (value): value is OrderedEventType =>
    isObject(value) &&
    typeof value.order === "number" &&
    isArrayOf(value.keys, isFelt252) &&
    isArrayOf(value.data, isFelt252),
  { identifier: "OrderedEvent" },
);

const OrderedMessageTypeSchema = Schema.declare<OrderedMessageType>(
  (value): value is OrderedMessageType =>
    isObject(value) &&
    typeof value.order === "number" &&
    isFelt252(value.to_address) &&
    isArrayOf(value.payload, isFelt252),
  { identifier: "OrderedMessage" },
);

const isFunctionInvocation = (value: unknown): value is FunctionInvocationType =>
  isObject(value) &&
  isFelt252(value.contract_address) &&
  isFelt252(value.entry_point_selector) &&
  isArrayOf(value.calldata, isFelt252) &&
  isFelt252(value.caller_address) &&
  isFelt252(value.class_hash) &&
  typeof value.entry_point_type === "string" &&
  typeof value.call_type === "string" &&
  isArrayOf(value.result, isFelt252) &&
  isArrayOf(value.calls, isFunctionInvocation) &&
  isArrayOf(
    value.events,
    (event): event is OrderedEventType =>
      isObject(event) &&
      typeof event.order === "number" &&
      isArrayOf(event.keys, isFelt252) &&
      isArrayOf(event.data, isFelt252),
  ) &&
  isArrayOf(
    value.messages,
    (message): message is OrderedMessageType =>
      isObject(message) &&
      typeof message.order === "number" &&
      isFelt252(message.to_address) &&
      isArrayOf(message.payload, isFelt252),
  ) &&
  isObject(value.execution_resources);

const FunctionInvocationTypeSchema = Schema.declare<FunctionInvocationType>(
  isFunctionInvocation,
  { identifier: "FunctionInvocation" },
);

const RevertibleFunctionInvocationTypeSchema =
  Schema.declare<RevertibleFunctionInvocationType>(
    (value): value is RevertibleFunctionInvocationType =>
      isFunctionInvocation(value) ||
      (isObject(value) && typeof value.revert_reason === "string" && typeof value.type === "string"),
    { identifier: "RevertibleFunctionInvocation" },
  );

const TransactionTraceTypeSchema = Schema.declare<TransactionTraceType>(
  (value): value is TransactionTraceType =>
    isObject(value) && typeof value.type === "string",
  { identifier: "TransactionTrace" },
);

export const OrderedEventRpc: Schema.Schema<OrderedEventType, RpcOrderedEvent> = rpcTransform(
  OrderedEventTypeSchema,
  orderedEventFromRpc,
  orderedEventToRpc,
  {
    identifier: "Kundera.OrderedEvent.Rpc",
    title: "Starknet Ordered Event",
    description: "Ordered event decoded from Starknet trace RPC wire data.",
    errorMessage: "Invalid Starknet ordered-event RPC value",
  },
);

export const OrderedMessageRpc: Schema.Schema<OrderedMessageType, RpcOrderedMessage> =
  rpcTransform(OrderedMessageTypeSchema, orderedMessageFromRpc, orderedMessageToRpc, {
    identifier: "Kundera.OrderedMessage.Rpc",
    title: "Starknet Ordered Message",
    description: "Ordered message decoded from Starknet trace RPC wire data.",
    errorMessage: "Invalid Starknet ordered-message RPC value",
  });

export const FunctionInvocationRpc: Schema.Schema<
  FunctionInvocationType,
  RpcFunctionInvocation
> = rpcTransform(
  FunctionInvocationTypeSchema,
  functionInvocationFromRpc,
  functionInvocationToRpc,
  {
    identifier: "Kundera.FunctionInvocation.Rpc",
    title: "Starknet Function Invocation",
    description: "Function invocation decoded from Starknet trace RPC wire data.",
    errorMessage: "Invalid Starknet function-invocation RPC value",
  },
);

export const RevertibleFunctionInvocationRpc: Schema.Schema<
  RevertibleFunctionInvocationType,
  RpcRevertibleFunctionInvocation
> = rpcTransform(
  RevertibleFunctionInvocationTypeSchema,
  revertibleFunctionInvocationFromRpc,
  revertibleFunctionInvocationToRpc,
  {
    identifier: "Kundera.RevertibleFunctionInvocation.Rpc",
    title: "Starknet Revertible Function Invocation",
    description:
      "Revertible function invocation decoded from Starknet trace RPC wire data.",
    errorMessage: "Invalid Starknet revertible-function-invocation RPC value",
  },
);

export const Rpc: Schema.Schema<TransactionTraceType, RpcTransactionTrace> = rpcTransform(
  TransactionTraceTypeSchema,
  transactionTraceFromRpc,
  transactionTraceToRpc,
  {
    identifier: "Kundera.Trace.Rpc",
    title: "Starknet Transaction Trace",
    description: "Transaction trace decoded from Starknet trace API RPC wire data.",
    errorMessage: "Invalid Starknet transaction-trace RPC value",
  },
);
