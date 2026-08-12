export function delay(ms?: number): Promise<void> {
  const wait = ms ?? 120 + Math.random() * 130; // 120–250 ms
  return new Promise(resolve => setTimeout(resolve, wait));
}
