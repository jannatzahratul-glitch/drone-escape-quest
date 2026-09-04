/**
 * ReviveService — future-ready architecture only.
 *
 * There is NO ad network, no ad unit id and no placeholder advertisement here.
 * A rewarded provider (or a coin cost) can be registered later without
 * touching gameplay code: the game only ever asks `canRevive()` / `revive()`.
 */
export type ReviveCost = { kind: "free" } | { kind: "coins"; amount: number } | { kind: "rewarded" };

export interface ReviveProvider {
  cost: ReviveCost;
  isAvailable(): boolean;
  /** resolve true once the revive has been paid for / earned */
  request(): Promise<boolean>;
}

export interface SafePoint {
  x: number;
  y: number;
}

let provider: ReviveProvider | null = null;
let safePoint: SafePoint | null = null;

export function registerReviveProvider(p: ReviveProvider | null) {
  provider = p;
}

/** Gameplay records the last safe cell so a future revive can restore it. */
export function markSafePoint(point: SafePoint) {
  safePoint = point;
}

export const getSafePoint = () => safePoint;

/** Disabled until a provider is registered — revive is never mandatory. */
export const canRevive = () => Boolean(provider?.isAvailable());

export const reviveCost = (): ReviveCost | null => provider?.cost ?? null;

export async function requestRevive(): Promise<SafePoint | null> {
  if (!provider?.isAvailable()) return null;
  const ok = await provider.request();
  return ok ? safePoint : null;
}
