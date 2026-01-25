# Codebase Report: Voltaire Provider Implementation Patterns
Generated: 2026-01-25

## Summary

Voltaire implements a clean, type-safe EIP-1193 provider architecture with three layers:
1. **Base Provider Interface** - Minimal EIP-1193 compliance (request + events)
2. **Concrete Implementations** - HttpProvider (stateless), WebSocketProvider (stateful)
3. **Typed Wrapper Layer** - TypedProvider with RpcSchema for compile-time type safety

The architecture uses TypeScript's advanced type system to map JSON-RPC method names to their parameter and return types, enabling full type inference without runtime overhead.

## Project Structure

```
src/provider/
├── Provider.ts               # Base EIP-1193 interface
├── types.ts                  # Core types (RequestArguments, RpcError, Response<T>)
├── HttpProvider.ts           # HTTP implementation (fetch + retry)
├── WebSocketProvider.ts      # WebSocket implementation (subscriptions + reconnect)
├── TypedProvider.ts          # Generic typed wrapper interface
├── RpcSchema.ts              # Schema type system
├── request/
│   ├── RequestArguments.ts   # Typed request args
│   ├── EIP1193RequestFn.ts   # Typed request function signature
│   └── EIP1193RequestOptions.ts  # Retry/timeout options
├── events/
│   ├── EIP1193Events.ts      # Event map types
│   └── ProviderRpcError.ts   # Error class
├── schemas/
│   ├── VoltaireRpcSchema.ts  # Full schema (eth/debug/engine methods)
│   └── DerivedRpcSchema.ts   # Schema derivation utilities
└── examples/
    └── typed-provider-example.ts  # Usage patterns
```

## Questions Answered

### Q1: Provider.ts - EIP-1193 request interface + events

**Location:** `/Users/msaug/workspace/voltaire/src/provider/Provider.ts`

**Interface Structure:**
```typescript
export interface Provider {
  // Single request method - throws on error (doesn't return error objects)
  request(args: RequestArguments): Promise<unknown>;
  
  // Event emitter methods
  on<E extends ProviderEvent>(
    event: E, 
    listener: (...args: ProviderEventMap[E]) => void
  ): this;
  
  removeListener<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void
  ): this;
}
```

**Key Patterns:**
- **EIP-1193 Compliance**: Provider interface is minimal - just `request()` + event methods
- **Throws on Error**: `request()` throws `RpcError` instead of returning error objects
- **Untyped Base**: Provider returns `Promise<unknown>` - typing happens at TypedProvider layer
- **Fluent Events**: Event methods return `this` for chaining

### Q2: types.ts - RequestArguments, Options, RpcError, Response<T>, events types

**Location:** `/Users/msaug/workspace/voltaire/src/provider/types.ts`

**Core Types:**

```typescript
// Basic request structure
export interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

// RPC Error (thrown by request, not returned)
export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Response wrapper (used internally by WebSocketProvider)
export interface Response<T> {
  result?: T;
  error?: RpcError;
}

// Request configuration
export interface RequestOptions {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

// EIP-1193 event types
export interface ProviderEventMap {
  accountsChanged: [accounts: string[]];
  chainChanged: [chainId: string];
  connect: [connectInfo: ProviderConnectInfo];
  disconnect: [error: RpcError];
  message: [message: { type: string; data: unknown }];
}

// WebSocket native subscriptions (async generators)
export interface ProviderEvents {
  newHeads: () => AsyncGenerator<unknown, void, unknown>;
  logs: (params?: Record<string, unknown>) => AsyncGenerator<unknown, void, unknown>;
  newPendingTransactions: () => AsyncGenerator<unknown, void, unknown>;
  syncing: () => AsyncGenerator<unknown, void, unknown>;
}
```

**Key Patterns:**
- **Response<T> vs Throwing**: `Response<T>` is internal (WebSocket's `_request()`), public `request()` throws
- **Readonly Arguments**: Request args are immutable (`readonly`)
- **Tuple Event Args**: Event map uses tuple types for type-safe listener args
- **Async Generator Events**: WebSocket subscriptions use async generators for streaming

### Q3: HttpProvider.ts - fetch + timeout + retry implementation

**Location:** `/Users/msaug/workspace/voltaire/src/provider/HttpProvider.ts`

**Class Structure:**
```typescript
export class HttpProvider implements Provider {
  private url: string;
  private headers: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetry: number;
  private defaultRetryDelay: number;
  private requestIdCounter = 0;
  private eventListeners: Map<ProviderEvent, Set<ProviderEventListener>>;

  constructor(options: HttpProviderOptions | string);
  
  // Public EIP-1193 method
  async request(args: RequestArguments): Promise<unknown>;
  
  // Private implementation methods
  private async executeRequest(body: string, timeout: number): Promise<unknown>;
  private handleRequestError(error: Error, timeout: number): boolean;
  
  // Event methods (present but unused for HTTP)
  on<E extends ProviderEvent>(...): this;
  removeListener<E extends ProviderEvent>(...): this;
  protected emit<E extends ProviderEvent>(...): void;
}
```

**Implementation Patterns:**

1. **Fetch with AbortController Timeout:**
```typescript
private async executeRequest(body: string, timeout: number): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(this.url, {
      method: "POST",
      headers: this.headers,
      body,
      signal: controller.signal,
    });
    
    if (!response.ok) {
      const error: RpcError = {
        code: -32603,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
      throw error;
    }
    
    const json = await response.json() as JsonRpcResponse;
    if (json.error) throw json.error;
    return json.result;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

2. **Retry Loop with Exponential Backoff:**
```typescript
async request(args: RequestArguments): Promise<unknown> {
  const { method, params } = args;
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: ++this.requestIdCounter,
    method,
    params: params ?? [],
  });
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= this.defaultRetry; attempt++) {
    try {
      return await this.executeRequest(body, this.defaultTimeout);
    } catch (error) {
      lastError = error as Error;
      const shouldRetry = this.handleRequestError(lastError, this.defaultTimeout);
      if (shouldRetry && attempt < this.defaultRetry) {
        await new Promise(resolve => setTimeout(resolve, this.defaultRetryDelay));
      }
    }
  }
  
  throw { code: -32603, message: lastError?.message ?? "Request failed" };
}
```

3. **Event Emitter (Stateless):**
- HTTP provider implements event methods for interface compliance
- `emit()` is protected and never called (HTTP is stateless)
- Note in docstring: "HttpProvider does not emit events as HTTP is stateless"

**Key Patterns:**
- **Separation of Concerns**: `executeRequest()` handles single attempt, `request()` handles retry logic
- **AbortController for Timeout**: Clean cancellation without race conditions
- **Error Type Detection**: `handleRequestError()` distinguishes timeout vs RPC errors
- **Request ID Counter**: Monotonic counter for JSON-RPC 2.0 correlation

### Q4: WebSocketProvider.ts - connect/reconnect, subscriptions, async generator events

**Location:** `/Users/msaug/workspace/voltaire/src/provider/WebSocketProvider.ts`

**Class Structure:**
```typescript
export class WebSocketProvider implements Provider {
  private url: string;
  private protocols?: string | string[];
  private ws: WebSocket | null = null;
  private requestId = 0;
  
  // Request/response correlation
  private pending = new Map<number, (response: any) => void>();
  
  // Subscription management
  private subscriptions = new Map<string, Set<(data: any) => void>>();
  
  // Reconnection state
  private reconnect: boolean;
  private reconnectDelay: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private isConnected = false;
  
  // Event listeners (EIP-1193)
  private eventListeners: Map<ProviderEvent, Set<(...args: any[]) => void>>;

  constructor(options: WebSocketProviderOptions | string);
  
  // Connection lifecycle
  async connect(): Promise<void>;
  disconnect(): void;
  
  // Public EIP-1193 interface
  async request(args: RequestArguments): Promise<unknown>;
  
  // Internal methods
  private async _request<T>(method: string, params?: any[], options?: RequestOptions): Promise<Response<T>>;
  private async subscribe(method: string, params?: any[]): Promise<string>;
  private async unsubscribe(subscriptionId: string): Promise<void>;
  
  // Event methods
  on<E extends ProviderEvent>(...): this;
  removeListener<E extends ProviderEvent>(...): this;
  protected emit<E extends ProviderEvent>(...): void;
  
  // Native WebSocket subscriptions (async generators)
  events: ProviderEvents;
  
  // RPC method shortcuts (50+ methods like eth_blockNumber, eth_call, etc.)
  eth_blockNumber(options?: RequestOptions): Promise<Response<string>>;
  eth_call(params: any, blockTag?: string, options?: RequestOptions): Promise<Response<string>>;
  // ... many more
}
```

**Implementation Patterns:**

1. **Connection with Reconnection Logic:**
```typescript
async connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.ws = new WebSocket(this.url, this.protocols);
    
    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
      
      // Emit connect event with chainId
      this._request<string>("eth_chainId")
        .then((response) => {
          if (response.result) {
            this.emit("connect", { chainId: response.result });
          }
        });
      resolve();
    };
    
    this.ws.onclose = () => {
      this.isConnected = false;
      this.emit("disconnect", { code: 4900, message: "WebSocket connection closed" });
      
      // Auto-reconnect
      if (this.reconnect && 
          (this.maxReconnectAttempts === 0 || this.reconnectAttempts < this.maxReconnectAttempts)) {
        this.reconnectAttempts++;
        this.reconnectTimeout = setTimeout(() => {
          this.connect().catch(() => {});
        }, this.reconnectDelay);
      }
    };
  });
}
```

2. **Dual Request Methods (Public throws, Internal returns Response<T>):**
```typescript
// Public EIP-1193 method - throws on error
async request(args: RequestArguments): Promise<unknown> {
  const response = await this._request(args.method, args.params as any[]);
  if (response.error) throw response.error;
  return response.result;
}

// Internal method - returns Response<T>
private async _request<T>(
  method: string, 
  params: any[] = [], 
  options?: RequestOptions
): Promise<Response<T>> {
  if (!this.isConnected || !this.ws) {
    return { error: { code: -32603, message: "WebSocket not connected" } };
  }
  
  const timeout = options?.timeout ?? 30000;
  const id = ++this.requestId;
  const request = JSON.stringify({ jsonrpc: "2.0", id, method, params });
  
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      this.pending.delete(id);
      resolve({ error: { code: -32603, message: `Request timeout after ${timeout}ms` } });
    }, timeout);
    
    this.pending.set(id, (response) => {
      clearTimeout(timeoutId);
      if (response.error) {
        resolve({ error: response.error });
      } else {
        resolve({ result: response.result });
      }
    });
    
    this.ws?.send(request);
  });
}
```

3. **Message Routing (Responses vs Subscriptions):**
```typescript
this.ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  // Handle subscription notifications
  if (message.method === "eth_subscription") {
    const subscriptionId = message.params.subscription;
    const callbacks = this.subscriptions.get(subscriptionId);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(message.params.result);
      }
    }
    return;
  }
  
  // Handle RPC responses
  const callback = this.pending.get(message.id);
  if (callback) {
    callback(message);
    this.pending.delete(message.id);
  }
};
```

4. **Async Generator Subscriptions:**
```typescript
events: ProviderEvents = {
  newHeads: async function* (this: WebSocketProvider) {
    const subscriptionId = await this.subscribe("newHeads");
    const queue: any[] = [];
    let resolve: ((value: any) => void) | null = null;
    
    const callback = (data: any) => {
      if (resolve) {
        resolve(data);
        resolve = null;
      } else {
        queue.push(data);
      }
    };
    
    this.subscriptions.get(subscriptionId)?.add(callback);
    
    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          yield await new Promise((r) => { resolve = r; });
        }
      }
    } finally {
      await this.unsubscribe(subscriptionId);
    }
  }.bind(this),
  
  // Similar for logs, newPendingTransactions, syncing...
}
```

**Usage:**
```typescript
// Subscribe to new blocks
for await (const block of provider.events.newHeads()) {
  console.log('New block:', block);
}

// Subscribe to logs with filter
for await (const log of provider.events.logs({ address: '0x...' })) {
  console.log('New log:', log);
}
```

5. **Shortcut Methods (Return Response<T> not throws):**
```typescript
// All shortcut methods use internal _request (returns Response<T>)
eth_blockNumber(options?: RequestOptions) {
  return this._request<string>("eth_blockNumber", [], options);
}

eth_call(params: any, blockTag = "latest", options?: RequestOptions) {
  return this._request<string>("eth_call", [params, blockTag], options);
}

// Usage: caller must check response.error
const response = await provider.eth_blockNumber();
if (response.error) {
  console.error(response.error);
} else {
  console.log(response.result);
}
```

**Key Patterns:**
- **Dual API**: Public `request()` throws (EIP-1193), internal `_request()` returns `Response<T>`
- **Pending Request Map**: Correlates responses to promises via incrementing ID
- **Subscription Registry**: Maps subscription IDs to callback sets
- **Async Generator Pattern**: Queue + resolver for streaming events
- **Auto-Reconnect**: Exponential backoff with max attempts
- **Message Routing**: Distinguishes subscriptions from RPC responses

### Q5: TypedProvider.ts - typed request wrapper

**Location:** `/Users/msaug/workspace/voltaire/src/provider/TypedProvider.ts`

**Interface Structure:**
```typescript
export interface TypedProvider<
  TRpcSchema extends RpcSchema = RpcSchema,
  TEventMap extends Record<string, (...args: any[]) => void> = EIP1193EventMap,
> {
  // Typed request function
  request: EIP1193RequestFn<TRpcSchema>;
  
  // Typed event methods
  on<TEvent extends keyof TEventMap>(
    event: TEvent,
    listener: TEventMap[TEvent],
  ): this;
  
  removeListener<TEvent extends keyof TEventMap>(
    event: TEvent,
    listener: TEventMap[TEvent],
  ): this;
}

// Standard EIP-1193 provider type alias
export type EIP1193Provider = TypedProvider<RpcSchema, EIP1193EventMap>;
```

**EIP1193RequestFn Type:**
```typescript
// from request/EIP1193RequestFn.ts
export type EIP1193RequestFn<TRpcSchema extends RpcSchema> = <
  TMethod extends RpcMethodNames<TRpcSchema>,
>(
  args: RequestArguments<TRpcSchema, TMethod>,
  options?: EIP1193RequestOptions,
) => Promise<RpcMethodReturnType<TRpcSchema, TMethod>>;
```

**Key Patterns:**
- **Generic Wrapper**: TypedProvider wraps base Provider with schema-driven types
- **Type Inference**: Return type automatically inferred from method name
- **Schema Constraint**: `TRpcSchema extends RpcSchema` ensures valid schema
- **Event Map Constraint**: `TEventMap extends Record<string, (...args: any[]) => void>` for custom events

**Usage Example:**
```typescript
// Create typed provider
type VoltaireProvider = TypedProvider<VoltaireRpcSchema, EIP1193EventMap>;

const provider: VoltaireProvider = {
  request: async ({ method, params }) => {
    // Implementation
  },
  on: (event, listener) => provider,
  removeListener: (event, listener) => provider,
};

// Type-safe calls
const blockNumber = await provider.request({ 
  method: 'eth_blockNumber' 
}); // string

const balance = await provider.request({ 
  method: 'eth_getBalance',
  params: ['0x...', 'latest']
}); // string

// Type errors
await provider.request({ method: 'invalid_method' }); // ❌ Compile error
await provider.request({ method: 'eth_getBalance' }); // ❌ Missing params
```

### Q6: RpcSchema.ts - schema mapping

**Location:** `/Users/msaug/workspace/voltaire/src/provider/RpcSchema.ts`

**Schema Type System:**
```typescript
// Base schema type
export type RpcSchema = readonly {
  Method: string;
  Parameters?: unknown;
  ReturnType: unknown;
}[];

// Extract method names from schema
export type RpcMethodNames<TSchema extends RpcSchema> = 
  TSchema[number]["Method"];

// Extract parameters for specific method
export type RpcMethodParameters<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> = Extract<TSchema[number], { Method: TMethod }>["Parameters"];

// Extract return type for specific method
export type RpcMethodReturnType<
  TSchema extends RpcSchema,
  TMethod extends RpcMethodNames<TSchema>,
> = Extract<TSchema[number], { Method: TMethod }>["ReturnType"];
```

**Key Patterns:**
- **Readonly Tuple**: Schema is `readonly` array for immutability
- **Indexed Access**: `TSchema[number]` accesses union of all schema entries
- **Extract Pattern**: `Extract<TSchema[number], { Method: TMethod }>` finds matching entry
- **Type Inference**: Method name → params/return type via conditional types

**Example Schema:**
```typescript
const MySchema = [
  {
    Method: 'eth_blockNumber',
    Parameters: [],
    ReturnType: string
  },
  {
    Method: 'eth_call',
    Parameters: [{ to: string, data: string }, string],
    ReturnType: string
  }
] as const satisfies RpcSchema;

// Type extraction
type Methods = RpcMethodNames<typeof MySchema>; 
// => 'eth_blockNumber' | 'eth_call'

type CallParams = RpcMethodParameters<typeof MySchema, 'eth_call'>; 
// => [{ to: string, data: string }, string]

type CallReturn = RpcMethodReturnType<typeof MySchema, 'eth_call'>; 
// => string
```

### Q7: VoltaireRpcSchema.ts - Full method definitions

**Location:** `/Users/msaug/workspace/voltaire/src/provider/schemas/VoltaireRpcSchema.ts`

**Schema Structure:**
```typescript
export type VoltaireRpcSchema = readonly [
  // eth namespace (52 methods)
  {
    Method: "eth_accounts";
    Parameters: [];
    ReturnType: string[];
  },
  {
    Method: "eth_call";
    Parameters: [
      {
        from?: string;
        to: string;
        gas?: string;
        gasPrice?: string;
        value?: string;
        data?: string;
      },
      string,
    ];
    ReturnType: string;
  },
  // ... 50+ more eth methods
  
  // debug namespace (5 methods)
  {
    Method: "debug_getRawBlock";
    Parameters: [string];
    ReturnType: string;
  },
  
  // engine namespace (20+ methods)
  {
    Method: "engine_newPayloadV3";
    Parameters: [unknown, string[]?, string?];
    ReturnType: unknown;
  },
  
  // web3 namespace (2 methods)
  {
    Method: "web3_clientVersion";
    Parameters: [];
    ReturnType: string;
  },
  
  // net namespace (3 methods)
  {
    Method: "net_version";
    Parameters: [];
    ReturnType: string;
  },
  
  // txpool namespace (3 methods)
  {
    Method: "txpool_status";
    Parameters: [];
    ReturnType: { pending: string; queued: string };
  },
  
  // anvil namespace (testing methods)
  {
    Method: "anvil_impersonateAccount";
    Parameters: [string];
    ReturnType: null;
  },
  {
    Method: "evm_mine";
    Parameters: [{ blocks?: number; timestamp?: number }?];
    ReturnType: string;
  },
];
```

**Namespaces Covered:**
- `eth_*` - 52 methods (accounts, blocks, transactions, logs, filters, etc.)
- `debug_*` - 5 methods (trace, raw blocks)
- `engine_*` - 20+ methods (consensus layer Engine API)
- `web3_*` - 2 methods (client version, sha3)
- `net_*` - 3 methods (version, listening, peer count)
- `txpool_*` - 3 methods (status, content, inspect)
- `anvil_*` / `evm_*` - 9 test methods (impersonate, mine, snapshot, etc.)

**Key Patterns:**
- **Comprehensive Coverage**: All standard Ethereum JSON-RPC methods
- **Optional Parameters**: Uses `?` for optional params (e.g., `string?`)
- **Complex Types**: References primitives like `BlockType`, `TransactionType`, `ReceiptType`
- **Union Returns**: Some methods return unions (e.g., `eth_syncing` returns `false | { ... }`)

## Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                    User/Application Code                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Uses typed interface
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  TypedProvider<VoltaireRpcSchema, EIP1193EventMap>          │
│  - Compile-time type safety                                 │
│  - Method name → params/return type mapping                 │
│  - Event type safety                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Implements
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Provider Interface                        │
│  - request(args: RequestArguments): Promise<unknown>        │
│  - on(event, listener): this                                │
│  - removeListener(event, listener): this                    │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │ Implemented by           │ Implemented by
               ▼                          ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│    HttpProvider          │  │    WebSocketProvider           │
│    (Stateless)           │  │    (Stateful)                  │
├──────────────────────────┤  ├────────────────────────────────┤
│ - fetch() with timeout   │  │ - WebSocket connection         │
│ - Retry logic            │  │ - Auto-reconnect               │
│ - AbortController        │  │ - Request/response correlation │
│ - No events emitted      │  │ - Subscription management      │
│                          │  │ - Async generator events       │
│                          │  │ - Emits connect/disconnect     │
└──────────────────────────┘  └────────────────────────────────┘
               │                          │
               │ Uses                     │ Uses
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    JSON-RPC 2.0 Protocol                     │
│  { jsonrpc: "2.0", id: number, method: string, params: [] } │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Ethereum RPC Endpoint                        │
│           (Geth, Reth, Anvil, Hardhat, etc.)                │
└─────────────────────────────────────────────────────────────┘
```

## Key Implementation Patterns

### Pattern 1: Response<T> vs Throwing

**Two approaches for error handling:**

| Layer | Method | Error Handling |
|-------|--------|----------------|
| Public API | `request(args)` | Throws `RpcError` (EIP-1193 compliant) |
| Internal API | `_request<T>()` | Returns `Response<T> = { result?: T, error?: RpcError }` |
| Shortcut methods | `eth_blockNumber()` | Returns `Response<T>` (caller checks) |

**Why both?**
- EIP-1193 spec requires `request()` to throw
- Internal `_request()` returns `Response<T>` for easier error handling in implementation
- Shortcut methods (WebSocketProvider only) use `Response<T>` for flexibility

**Example:**
```typescript
// EIP-1193 public API - throws
try {
  const result = await provider.request({ method: 'eth_blockNumber' });
  console.log(result); // string
} catch (error) {
  console.error(error.code, error.message);
}

// Internal WebSocket API - returns Response<T>
const response = await provider.eth_blockNumber();
if (response.error) {
  console.error(response.error.code, response.error.message);
} else {
  console.log(response.result); // string
}
```

### Pattern 2: Async Generator Subscriptions

**WebSocket subscriptions use async generators for streaming:**

```typescript
// Define subscription in ProviderEvents
export interface ProviderEvents {
  newHeads: () => AsyncGenerator<unknown, void, unknown>;
  logs: (params?: Record<string, unknown>) => AsyncGenerator<unknown, void, unknown>;
}

// Implementation pattern
events: ProviderEvents = {
  newHeads: async function* (this: WebSocketProvider) {
    // 1. Subscribe to WebSocket event
    const subscriptionId = await this.subscribe("newHeads");
    
    // 2. Set up queue for buffering
    const queue: any[] = [];
    let resolve: ((value: any) => void) | null = null;
    
    // 3. Register callback for incoming data
    const callback = (data: any) => {
      if (resolve) {
        resolve(data);  // Waiting consumer - deliver immediately
        resolve = null;
      } else {
        queue.push(data);  // No consumer - buffer
      }
    };
    this.subscriptions.get(subscriptionId)?.add(callback);
    
    // 4. Yield loop with queue/promise pattern
    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();  // Deliver buffered data
        } else {
          yield await new Promise((r) => { resolve = r; });  // Wait for data
        }
      }
    } finally {
      // 5. Clean up on consumer exit
      await this.unsubscribe(subscriptionId);
    }
  }.bind(this),
};
```

**Usage:**
```typescript
// Consumer code
for await (const block of provider.events.newHeads()) {
  console.log('New block:', block);
  if (someCondition) break;  // Triggers finally cleanup
}
```

**Key Points:**
- **Buffering**: Queue prevents data loss if consumer is slow
- **Lazy Waiting**: Promise pattern avoids polling
- **Cleanup**: `finally` ensures unsubscribe on loop exit
- **Type Safety**: Return type `AsyncGenerator<T, void, unknown>` ensures type flow

### Pattern 3: TypedProvider Schema Mapping

**How method names map to types:**

```typescript
// 1. Define schema
export type VoltaireRpcSchema = readonly [
  {
    Method: "eth_blockNumber";
    Parameters: [];
    ReturnType: string;
  },
  {
    Method: "eth_call";
    Parameters: [{ to: string; data: string }, string];
    ReturnType: string;
  },
];

// 2. Extract utilities (RpcSchema.ts)
type RpcMethodNames<TSchema> = TSchema[number]["Method"];
// => "eth_blockNumber" | "eth_call"

type RpcMethodParameters<TSchema, TMethod> = 
  Extract<TSchema[number], { Method: TMethod }>["Parameters"];
// eth_call => [{ to: string; data: string }, string]

type RpcMethodReturnType<TSchema, TMethod> = 
  Extract<TSchema[number], { Method: TMethod }>["ReturnType"];
// eth_call => string

// 3. Typed request function (EIP1193RequestFn.ts)
export type EIP1193RequestFn<TRpcSchema> = <
  TMethod extends RpcMethodNames<TRpcSchema>
>(
  args: RequestArguments<TRpcSchema, TMethod>,
  options?: EIP1193RequestOptions,
) => Promise<RpcMethodReturnType<TRpcSchema, TMethod>>;

// 4. RequestArguments with schema constraint
export interface RequestArguments<TRpcSchema, TMethod> {
  readonly method: TMethod;
  readonly params?: RpcMethodParameters<TRpcSchema, TMethod>;
}

// 5. TypedProvider uses EIP1193RequestFn
export interface TypedProvider<TRpcSchema> {
  request: EIP1193RequestFn<TRpcSchema>;
  // ...
}
```

**Result: Full type inference**
```typescript
const provider: TypedProvider<VoltaireRpcSchema> = ...;

// ✅ Type inference works
const blockNumber = await provider.request({ 
  method: 'eth_blockNumber' 
}); // Promise<string>

const result = await provider.request({ 
  method: 'eth_call',
  params: [{ to: '0x...', data: '0x...' }, 'latest']
}); // Promise<string>

// ❌ Compile errors
await provider.request({ method: 'invalid_method' });
await provider.request({ method: 'eth_call' }); // Missing params
await provider.request({ 
  method: 'eth_call',
  params: [123, true] // Wrong param types
});
```

### Pattern 4: Event Type Safety

**Event map with tuple args for type-safe listeners:**

```typescript
// 1. Define event map (types.ts)
export interface ProviderEventMap {
  accountsChanged: [accounts: string[]];
  chainChanged: [chainId: string];
  connect: [connectInfo: ProviderConnectInfo];
  disconnect: [error: RpcError];
  message: [message: { type: string; data: unknown }];
}

// 2. Generic event methods (Provider.ts)
interface Provider {
  on<E extends ProviderEvent>(
    event: E,
    listener: (...args: ProviderEventMap[E]) => void
  ): this;
}

// 3. Usage with type inference
provider.on('chainChanged', (chainId) => {
  // chainId: string (inferred from tuple)
  console.log('Chain:', parseInt(chainId, 16));
});

provider.on('accountsChanged', (accounts) => {
  // accounts: string[] (inferred)
  if (accounts.length > 0) {
    console.log('Active:', accounts[0]);
  }
});

// ❌ Type errors
provider.on('chainChanged', (accounts: string[]) => {
  // Error: accounts should be string, not string[]
});

provider.on('invalidEvent', () => {}); // Error: event doesn't exist
```

**Key Points:**
- **Tuple Types**: `[accounts: string[]]` preserves parameter names and order
- **Spread in Listener**: `(...args: ProviderEventMap[E])` unpacks tuple
- **Type Inference**: TypeScript infers listener params from event name
- **Method Chaining**: Return `this` enables fluent API

### Pattern 5: Connection State Management (WebSocket)

**Reconnection with exponential backoff:**

```typescript
class WebSocketProvider {
  private reconnect: boolean;
  private reconnectDelay: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private isConnected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url, this.protocols);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset on success
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = undefined;
        }
        resolve();
      };
      
      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit("disconnect", { code: 4900, message: "Closed" });
        
        // Auto-reconnect logic
        if (this.reconnect && 
            (this.maxReconnectAttempts === 0 || 
             this.reconnectAttempts < this.maxReconnectAttempts)) {
          this.reconnectAttempts++;
          this.reconnectTimeout = setTimeout(() => {
            this.connect().catch(() => {}); // Recursive reconnect
          }, this.reconnectDelay);
        }
      };
      
      this.ws.onerror = (error) => {
        if (!this.isConnected) reject(error); // Initial connection failed
      };
    });
  }
  
  disconnect(): void {
    this.reconnect = false; // Disable auto-reconnect
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
```

**Key Points:**
- **Infinite Reconnect**: `maxReconnectAttempts === 0` means retry forever
- **Reset on Success**: `reconnectAttempts = 0` after successful connection
- **Clean Disconnect**: `disconnect()` sets `reconnect = false` to prevent loop
- **Error Handling**: Only reject initial connection errors, not reconnect failures

## Conventions Discovered

### Naming Conventions
- **Files**: PascalCase for classes (`HttpProvider.ts`, `WebSocketProvider.ts`)
- **Interfaces**: PascalCase (`Provider`, `TypedProvider`)
- **Types**: PascalCase (`RpcSchema`, `RequestArguments`)
- **Type Parameters**: `T` prefix (`TRpcSchema`, `TMethod`, `TEventMap`)
- **Private Methods**: Underscore prefix for internal APIs (`_request()`)
- **Shortcut Methods**: Match RPC method names (`eth_blockNumber()`, not `getBlockNumber()`)

### Code Organization
- **Separation**: Types in separate files (`types.ts`, `RpcSchema.ts`)
- **Namespacing**: Related types in subdirectories (`request/`, `events/`, `schemas/`)
- **Examples**: Usage examples in `examples/` directory
- **Tests**: Co-located `*.test.ts` files

### Type Safety Patterns
- **Readonly**: All request args are `readonly`
- **Const Assertions**: Schemas use `as const satisfies RpcSchema`
- **Biome Ignores**: Explicit `// biome-ignore` comments for `any` usage with justification
- **Generic Constraints**: `extends RpcSchema`, `extends ProviderEvent`

### Error Handling
- **EIP-1193 Compliance**: Public `request()` throws, never returns errors
- **Error Codes**: Use standard EIP-1193 codes (4001, 4100, 4200, 4900, 4901)
- **Internal Flexibility**: `_request()` returns `Response<T>` for implementation ease
- **Timeout Errors**: Code `-32603` with descriptive message

## Usage Examples

### Basic HTTP Provider
```typescript
import { HttpProvider } from 'voltaire/provider';

const provider = new HttpProvider({
  url: 'https://eth.llamarpc.com',
  timeout: 30000,
  retry: 3,
  retryDelay: 1000
});

// Make request
const blockNumber = await provider.request({
  method: 'eth_blockNumber',
  params: []
});

console.log(parseInt(blockNumber, 16));
```

### WebSocket Provider with Subscriptions
```typescript
import { WebSocketProvider } from 'voltaire/provider';

const provider = new WebSocketProvider({
  url: 'wss://eth.llamarpc.com',
  reconnect: true,
  reconnectDelay: 5000,
  maxReconnectAttempts: 0 // Infinite
});

await provider.connect();

// Subscribe to new blocks
for await (const block of provider.events.newHeads()) {
  console.log('New block:', block);
}

// Subscribe to logs
for await (const log of provider.events.logs({ 
  address: '0x...',
  topics: ['0x...']
})) {
  console.log('New log:', log);
}
```

### Typed Provider (Full Type Safety)
```typescript
import type { TypedProvider, VoltaireRpcSchema, EIP1193EventMap } from 'voltaire/provider';
import { HttpProvider } from 'voltaire/provider';

// Cast to typed provider
const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = 
  new HttpProvider('https://eth.llamarpc.com') as any;

// Full type inference
const blockNumber = await provider.request({ 
  method: 'eth_blockNumber' 
}); // string

const balance = await provider.request({ 
  method: 'eth_getBalance',
  params: ['0x...', 'latest']
}); // string

const block = await provider.request({
  method: 'eth_getBlockByNumber',
  params: ['latest', true]
}); // BlockType | null

// Type-safe events
provider.on('chainChanged', (chainId) => {
  console.log('Chain:', chainId); // string
});

provider.on('accountsChanged', (accounts) => {
  console.log('Accounts:', accounts); // string[]
});
```

### Error Handling
```typescript
import { ProviderRpcError, EIP1193ErrorCode } from 'voltaire/provider';

try {
  const result = await provider.request({
    method: 'eth_call',
    params: [{ to: '0x...', data: '0x...' }, 'latest']
  });
} catch (error) {
  if (error instanceof ProviderRpcError) {
    switch (error.code) {
      case EIP1193ErrorCode.UserRejectedRequest:
        console.error('User rejected');
        break;
      case EIP1193ErrorCode.Unauthorized:
        console.error('Unauthorized');
        break;
      case EIP1193ErrorCode.UnsupportedMethod:
        console.error('Method not supported');
        break;
      case -32603: // Internal error
        console.error('Internal error:', error.message);
        break;
    }
  }
}
```

## Key Files Reference

| File | Purpose | Entry Points |
|------|---------|--------------|
| `Provider.ts` | Base EIP-1193 interface | `interface Provider` |
| `types.ts` | Core type definitions | `RequestArguments`, `RpcError`, `Response<T>`, `ProviderEventMap` |
| `HttpProvider.ts` | HTTP implementation | `class HttpProvider implements Provider` |
| `WebSocketProvider.ts` | WebSocket implementation | `class WebSocketProvider implements Provider` |
| `TypedProvider.ts` | Typed wrapper interface | `interface TypedProvider<TRpcSchema, TEventMap>` |
| `RpcSchema.ts` | Schema type system | `type RpcSchema`, `RpcMethodNames`, `RpcMethodParameters`, `RpcMethodReturnType` |
| `schemas/VoltaireRpcSchema.ts` | Full method definitions | `type VoltaireRpcSchema` (100+ methods) |
| `request/EIP1193RequestFn.ts` | Typed request signature | `type EIP1193RequestFn<TRpcSchema>` |
| `request/RequestArguments.ts` | Typed request args | `interface RequestArguments<TRpcSchema, TMethod>` |
| `events/EIP1193Events.ts` | Event types | `interface EIP1193EventMap`, `interface EIP1193EventEmitter` |
| `examples/typed-provider-example.ts` | Usage patterns | `createMockProvider()`, `exampleTypeSafeRequests()` |

## Architecture Highlights

1. **Clean Separation**: Base `Provider` interface is minimal and untyped, `TypedProvider` adds compile-time safety
2. **Zero Runtime Overhead**: All typing happens at compile time via TypeScript's type system
3. **EIP-1193 Compliance**: Strict adherence to EIP-1193 spec (throws on error, standard events)
4. **Transport Agnostic**: HTTP and WebSocket share same interface, easily extensible
5. **Dual Error Handling**: Public API throws (EIP-1193), internal API uses `Response<T>` (flexibility)
6. **Async Generator Subscriptions**: Clean streaming API for WebSocket events
7. **Type-Safe Schema System**: Method names → params/return types via indexed access types
8. **Comprehensive Coverage**: 100+ JSON-RPC methods across 7 namespaces

## Open Questions

None - all requested files and patterns have been documented.
