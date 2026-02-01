# Event Filtering Skill

Decode and filter receipt events using ABI metadata. Copy into your project and tailor as needed.

## Quick Start

```bash
cp -r examples/skills/event-filtering src/skills/
```

## Usage

```ts
import { decodeEvents } from './skills/event-filtering';

const { result } = decodeEvents(receipt, abi, {
  event: 'Transfer',
  args: { from: [addr1, addr2], to: addr3 },
  address: contractAddress,
});

if (result) {
  for (const event of result) {
    console.log(event.name, event.args);
  }
}
```

## Notes

- `decodeEvents` skips unknown events.
- `decodeEventsStrict` errors on the first unknown event.
- `compileEventFilter` returns raw key filters you can reuse for matching.
