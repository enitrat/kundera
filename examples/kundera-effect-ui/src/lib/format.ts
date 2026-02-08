export const shortAddress = (addr: string): string =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export function formatEth(wei: bigint, decimals = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const frac = (wei % divisor)
    .toString()
    .padStart(decimals, '0')
    .slice(0, 6)
    .replace(/0+$/u, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function formatGasPrice(weiString: string): string {
  const wei = BigInt(weiString);
  const gwei = Number(wei) / 1e9;

  if (gwei < 0.01) return `${(Number(wei) / 1e6).toFixed(2)} Mwei`;
  if (gwei < 1) return `${gwei.toFixed(4)} Gwei`;
  return `${gwei.toFixed(2)} Gwei`;
}

export function formatFee(fee: { amount: string; unit: string }): string {
  const amount = BigInt(fee.amount);
  const eth = Number(amount) / 1e18;
  return `${eth.toFixed(6)} ${fee.unit}`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const diff = Date.now() - date.getTime();

  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleString();
}
