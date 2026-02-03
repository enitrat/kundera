import { beforeAll } from 'bun:test';
import { isNativeAvailable, loadWasmCrypto } from '../crypto/index';

beforeAll(async () => {
  if (isNativeAvailable()) return;
  await loadWasmCrypto();
});
