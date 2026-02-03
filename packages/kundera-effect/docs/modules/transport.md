---
title: Transport
description: HTTP and WebSocket transports for JSON-RPC
---

# Transport

The `Transport` module provides HTTP and WebSocket transports for Starknet JSON-RPC communication.

## Import

```typescript
import * as Transport from "@kundera-sn/kundera-effect/transport";
// Or specific exports
import { httpTransport, webSocketTransport } from "@kundera-sn/kundera-effect/transport";
```

## HTTP Transport

### Create Transport

```typescript
const transport = Transport.httpTransport({
  url: "https://starknet-mainnet.public.blastapi.io",
  headers: {
    "Authorization": "Bearer ..."
  },
  timeout: 30000
});
```

### Options

```typescript
interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
```

## WebSocket Transport

### Create Transport

```typescript
const transport = Transport.webSocketTransport({
  url: "wss://starknet-mainnet.public.blastapi.io/ws"
});
```

### Connect/Disconnect

```typescript
// Connect
yield* Transport.connect(transport);

// Disconnect
yield* Transport.disconnect(transport);
```

### Options

```typescript
interface WebSocketTransportOptions {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectDelay?: number;
}
```

## Making Requests

### Single Request

```typescript
const response = yield* Transport.request<BlockWithTxHashes>(
  transport,
  Transport.createRequest("starknet_getBlockWithTxHashes", ["latest"])
);
```

### Batch Request

```typescript
const responses = yield* Transport.requestBatch<unknown[]>(
  transport,
  [
    Transport.createRequest("starknet_blockNumber", []),
    Transport.createRequest("starknet_chainId", [])
  ]
);
```

### Close Transport

```typescript
yield* Transport.close(transport);
```

## Request Utilities

### createRequest

Create a JSON-RPC request object.

```typescript
const request = Transport.createRequest("starknet_call", [callParams, "latest"]);
// { jsonrpc: "2.0", id: 1, method: "...", params: [...] }
```

### createErrorResponse

Create an error response.

```typescript
const error = Transport.createErrorResponse(id, code, message);
```

### matchBatchResponses

Match batch responses to requests.

```typescript
const matched = Transport.matchBatchResponses(requests, responses);
```

### isJsonRpcError

Check if response is an error.

```typescript
if (Transport.isJsonRpcError(response)) {
  console.log(response.error.code);
  console.log(response.error.message);
}
```

## Types

```typescript
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: unknown[];
}

interface JsonRpcSuccessResponse<T> {
  jsonrpc: "2.0";
  id: number | string;
  result: T;
}

interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: number | string;
  error: JsonRpcError;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}
```

## Error Codes

```typescript
const JsonRpcErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Starknet-specific
  CONTRACT_NOT_FOUND: 20,
  BLOCK_NOT_FOUND: 24,
  TRANSACTION_HASH_NOT_FOUND: 25,
  // ... more
};
```

## Example Usage

```typescript
import { Effect } from "effect";
import * as Transport from "@kundera-sn/kundera-effect/transport";

const program = Effect.gen(function* () {
  // Create HTTP transport
  const http = Transport.httpTransport({
    url: "https://starknet-mainnet.public.blastapi.io"
  });

  // Make a request
  const blockNumber = yield* Transport.request<number>(
    http,
    Transport.createRequest("starknet_blockNumber", [])
  );

  console.log("Block:", blockNumber);

  // For WebSocket
  const ws = Transport.webSocketTransport({
    url: "wss://starknet-mainnet.public.blastapi.io/ws"
  });

  yield* Transport.connect(ws);

  // Subscribe to new heads
  const subId = yield* Transport.request<string>(
    ws,
    Transport.createRequest("starknet_subscribeNewHeads", [{}])
  );

  // Later: disconnect
  yield* Transport.disconnect(ws);

  return blockNumber;
});
```

## Error Handling

```typescript
const program = Transport.request(transport, request).pipe(
  Effect.catchTag("TransportError", (e) => {
    console.log(e.operation); // "request"
    console.log(e.message);   // Network error details
    return Effect.fail(e);
  })
);
```
