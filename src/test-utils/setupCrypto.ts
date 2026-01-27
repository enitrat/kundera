import { beforeAll } from 'bun:test';
import { isNativeAvailable, loadWasmCrypto } from '../crypto/index';

beforeAll(async () => {
  if (isNativeAvailable()) return;
  try {
    await loadWasmCrypto();
  } catch {
    // If WASM isn't available in this environment, tests will fall back to
    // asserting NotImplemented behavior.
  }
});
