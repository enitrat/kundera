import * as Schema from "effect/Schema";
import {
  emittedEventFromRpc,
  emittedEventToRpc,
  eventFromRpc,
  eventToRpc,
  type EmittedEventType,
  type EventType,
} from "@kundera-sn/kundera-ts";
import { isArrayOf, isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcEvent = Parameters<typeof eventFromRpc>[0];
type RpcEmittedEvent = Parameters<typeof emittedEventFromRpc>[0];

const isEvent = (value: unknown): value is EventType =>
  isObject(value) &&
  isFelt252(value.from_address) &&
  isArrayOf(value.keys, isFelt252) &&
  isArrayOf(value.data, isFelt252);

const EventTypeSchema = Schema.declare<EventType>(isEvent, {
  identifier: "Event",
});

const EmittedEventTypeSchema = Schema.declare<EmittedEventType>(
  (value): value is EmittedEventType => {
    if (!isEvent(value)) {
      return false;
    }
    const v = value as unknown as Record<string, unknown>;
    return (
      isFelt252(v.block_hash) &&
      typeof v.block_number === "number" &&
      isFelt252(v.transaction_hash)
    );
  },
  { identifier: "EmittedEvent" },
);

export const Rpc: Schema.Schema<EventType, RpcEvent> = rpcTransform(
  EventTypeSchema,
  eventFromRpc,
  eventToRpc,
  {
    identifier: "Kundera.Event.Rpc",
    title: "Starknet Event",
    description: "Event decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet event RPC value",
  },
);

export const EmittedRpc: Schema.Schema<EmittedEventType, RpcEmittedEvent> = rpcTransform(
  EmittedEventTypeSchema,
  emittedEventFromRpc,
  emittedEventToRpc,
  {
    identifier: "Kundera.EmittedEvent.Rpc",
    title: "Starknet Emitted Event",
    description: "Emitted event with block metadata decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet emitted-event RPC value",
  },
);
