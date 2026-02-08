import { Context, Effect, Layer, Ref, Stream } from "effect";
import * as Duration from "effect/Duration";
import {
  decodeEvent,
  decodeEventBySelector,
  type Abi,
  type DecodedEvent,
} from "@kundera-sn/kundera-ts/abi";
import {
  Rpc,
  type EmittedEvent,
  type EventsFilter,
  type EventsResponse,
} from "@kundera-sn/kundera-ts/jsonrpc";

import { ContractError, type RpcError, type TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface EventReadOptions {
  readonly requestOptions?: RequestOptions;
}

export interface WatchEventsOptions extends EventReadOptions {
  readonly filter: EventsFilter;
  readonly pollInterval?: Duration.DurationInput;
  readonly maxSeenEvents?: number;
}

export interface DecodeEventParams {
  readonly event: EmittedEvent;
  readonly abi: Abi;
  readonly eventNameOrSelector?: string;
}

export interface WatchDecodedEventsOptions extends WatchEventsOptions {
  readonly abi: Abi;
  readonly eventNameOrSelector?: string;
}

export interface EventServiceShape {
  readonly getEvents: (
    filter: EventsFilter,
    options?: EventReadOptions,
  ) => Effect.Effect<EventsResponse, TransportError | RpcError>;

  readonly watchEvents: (
    options: WatchEventsOptions,
  ) => Stream.Stream<EmittedEvent, TransportError | RpcError>;

  readonly decodeEvent: (
    params: DecodeEventParams,
  ) => Effect.Effect<DecodedEvent, ContractError>;

  readonly watchDecodedEvents: (
    options: WatchDecodedEventsOptions,
  ) => Stream.Stream<DecodedEvent, TransportError | RpcError | ContractError>;
}

export class EventService extends Context.Tag("@kundera/EventService")<
  EventService,
  EventServiceShape
>() {}

const toEventId = (event: EmittedEvent): string =>
  [
    event.block_hash,
    event.transaction_hash,
    event.from_address,
    event.keys.join(","),
    event.data.join(","),
  ].join(":");

interface SeenState {
  readonly order: readonly string[];
  readonly set: ReadonlySet<string>;
}

const dedupeEvents = (
  events: readonly EmittedEvent[],
  maxSeenEvents: number,
  seenRef: Ref.Ref<SeenState>,
): Effect.Effect<readonly EmittedEvent[]> =>
  Ref.modify(seenRef, (state) => {
    const nextOrder = [...state.order];
    const nextSet = new Set(state.set);
    const freshEvents: EmittedEvent[] = [];

    for (const event of events) {
      const eventId = toEventId(event);
      if (nextSet.has(eventId)) {
        continue;
      }

      freshEvents.push(event);
      nextOrder.push(eventId);
      nextSet.add(eventId);
    }

    while (nextOrder.length > maxSeenEvents) {
      const removed = nextOrder.shift();
      if (removed) {
        nextSet.delete(removed);
      }
    }

    const nextState: SeenState = {
      order: nextOrder,
      set: nextSet,
    };

    return [freshEvents, nextState] as const;
  });

export const EventLive: Layer.Layer<EventService, never, ProviderService> = Layer.effect(
  EventService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;

    const getEvents: EventServiceShape["getEvents"] = (filter, options) => {
      const { method, params } = Rpc.GetEventsRequest(filter);
      return provider.request<EventsResponse>(method, params, options?.requestOptions);
    };

    const decodeEventEffect: EventServiceShape["decodeEvent"] = ({
      event,
      abi,
      eventNameOrSelector,
    }) =>
      Effect.try({
        try: () => {
          const decoded = eventNameOrSelector
            ? decodeEvent(abi, eventNameOrSelector, {
                keys: event.keys,
                data: event.data,
              })
            : decodeEventBySelector(abi, {
                keys: event.keys,
                data: event.data,
              });

          if (decoded.error) {
            throw new Error(decoded.error.message);
          }

          return decoded.result;
        },
        catch: (cause) =>
          new ContractError({
            contractAddress: event.from_address,
            functionName: eventNameOrSelector ?? event.keys[0] ?? "unknown",
            stage: "decode",
            message: "Failed to decode emitted event",
            cause,
          }),
      });

    const watchEvents: EventServiceShape["watchEvents"] = (options) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const pollInterval = Duration.decode(options.pollInterval ?? "5 seconds");
          const maxSeenEvents = Math.max(options.maxSeenEvents ?? 5_000, 1);

          const { continuation_token: initialContinuationToken, ...baseFilter } =
            options.filter;
          const continuationTokenRef = yield* Ref.make<string | undefined>(
            initialContinuationToken,
          );
          const firstPollRef = yield* Ref.make(true);
          const seenRef = yield* Ref.make<SeenState>({
            order: [],
            set: new Set<string>(),
          });

          const poll = Effect.gen(function* () {
            const firstPoll = yield* Ref.get(firstPollRef);
            if (firstPoll) {
              yield* Ref.set(firstPollRef, false);
            } else {
              yield* Effect.sleep(pollInterval);
            }

            const continuationToken = yield* Ref.get(continuationTokenRef);
            const response = yield* getEvents(
              {
                ...baseFilter,
                continuation_token: continuationToken,
              },
              {
                requestOptions: options.requestOptions,
              },
            );

            yield* Ref.set(continuationTokenRef, response.continuation_token);
            return yield* dedupeEvents(response.events, maxSeenEvents, seenRef);
          });

          return Stream.repeatEffect(poll).pipe(
            Stream.flatMap((events) => Stream.fromIterable(events)),
          );
        }),
      );

    const watchDecodedEvents: EventServiceShape["watchDecodedEvents"] = (options) =>
      watchEvents(options).pipe(
        Stream.mapEffect((event) =>
          decodeEventEffect({
            event,
            abi: options.abi,
            eventNameOrSelector: options.eventNameOrSelector,
          }),
        ),
      );

    return {
      getEvents,
      watchEvents,
      decodeEvent: decodeEventEffect,
      watchDecodedEvents,
    } satisfies EventServiceShape;
  }),
);
