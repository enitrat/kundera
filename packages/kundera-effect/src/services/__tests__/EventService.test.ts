import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Stream } from "effect";
import type { Abi } from "@kundera-sn/kundera-ts/abi";
import { getEventSelector } from "@kundera-sn/kundera-ts/abi";
import type { EmittedEvent, EventsResponse } from "@kundera-sn/kundera-ts/jsonrpc";

import { EventLive, EventService } from "../EventService.js";
import { ProviderService } from "../ProviderService.js";

const ERC20_ABI: Abi = [
  {
    type: "event",
    name: "Transfer",
    kind: "struct",
    members: [
      {
        name: "from",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "to",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      { name: "amount", type: "core::integer::u256", kind: "data" },
    ],
  },
];

const transferSelectorHex = `0x${getEventSelector("Transfer").toString(16)}`;

const transferEventA: EmittedEvent = {
  block_hash: "0x1",
  block_number: 1,
  transaction_hash: "0xaaa",
  from_address: "0x111",
  keys: [transferSelectorHex, "0x2", "0x3"],
  data: ["0xa", "0x0"],
};

const transferEventB: EmittedEvent = {
  block_hash: "0x2",
  block_number: 2,
  transaction_hash: "0xbbb",
  from_address: "0x111",
  keys: [transferSelectorHex, "0x4", "0x5"],
  data: ["0xb", "0x0"],
};

describe("EventService", () => {
  it.effect("getEvents delegates to ProviderService", () => {
    let observedMethod = "";

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        observedMethod = method;
        return Effect.succeed({
          events: [],
        } as EventsResponse as T);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(EventService, (events) =>
        events.getEvents({ chunk_size: 10 }),
      );

      expect(observedMethod).toBe("starknet_getEvents");
      expect(result.events).toEqual([]);
    }).pipe(
      Effect.provide(EventLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("watchEvents polls and de-duplicates repeated events", () => {
    let calls = 0;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string) => {
        calls += 1;
        if (calls === 1) {
          return Effect.succeed({
            events: [transferEventA],
          } as EventsResponse as T);
        }

        return Effect.succeed({
          events: [transferEventA, transferEventB],
        } as EventsResponse as T);
      },
    });

    return Effect.gen(function* () {
      const collected = yield* Effect.flatMap(EventService, (events) =>
        events
          .watchEvents({
            filter: { chunk_size: 10 },
            pollInterval: 0,
          })
          .pipe(Stream.take(2), Stream.runCollect),
      );
      const collectedEvents = Array.from(collected);

      expect(collectedEvents.length).toBe(2);
      expect(collectedEvents[0]?.transaction_hash).toBe("0xaaa");
      expect(collectedEvents[1]?.transaction_hash).toBe("0xbbb");
    }).pipe(
      Effect.provide(EventLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("decodeEvent decodes ABI events", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() =>
        Effect.succeed({
          events: [],
        } as EventsResponse as T),
    });

    return Effect.gen(function* () {
      const decoded = yield* Effect.flatMap(EventService, (events) =>
        events.decodeEvent({
          event: transferEventA,
          abi: ERC20_ABI,
          eventNameOrSelector: "Transfer",
        }),
      );

      expect(decoded.name).toBe("Transfer");
      expect((decoded.args.amount as bigint).toString()).toBe("10");
    }).pipe(
      Effect.provide(EventLive),
      Effect.provide(providerLayer),
    );
  });

  it.effect("watchDecodedEvents emits decoded event stream", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() =>
        Effect.succeed({
          events: [transferEventA],
        } as EventsResponse as T),
    });

    return Effect.gen(function* () {
      const decoded = yield* Effect.flatMap(EventService, (events) =>
        events
          .watchDecodedEvents({
            filter: { chunk_size: 10 },
            pollInterval: 0,
            abi: ERC20_ABI,
            eventNameOrSelector: "Transfer",
          })
          .pipe(Stream.take(1), Stream.runCollect),
      );
      const decodedEvents = Array.from(decoded);

      expect(decodedEvents.length).toBe(1);
      expect(decodedEvents[0]?.name).toBe("Transfer");
    }).pipe(
      Effect.provide(EventLive),
      Effect.provide(providerLayer),
    );
  });
});
