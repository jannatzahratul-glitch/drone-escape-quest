/**
 * RewardManager — clean interfaces for future reward integrations
 * (extra hint / revive / double XP / extra attempt).
 *
 * NO ad network, no placeholders, no fake inventory: today every reward is
 * simply granted locally by gameplay. A provider can be registered later
 * without touching gameplay code.
 */
export type RewardKind = "extra-hint" | "revive" | "double-xp" | "extra-attempt";

export interface RewardProvider {
  /** whether the reward can currently be granted */
  isAvailable(kind: RewardKind): boolean;
  /** resolve true once the reward has been earned */
  request(kind: RewardKind): Promise<boolean>;
}

let provider: RewardProvider | null = null;

export function registerRewardProvider(p: RewardProvider | null) {
  provider = p;
}

export function isRewardAvailable(kind: RewardKind) {
  return provider?.isAvailable(kind) ?? false;
}

export async function requestReward(kind: RewardKind): Promise<boolean> {
  if (!provider) return false;
  return provider.request(kind);
}
