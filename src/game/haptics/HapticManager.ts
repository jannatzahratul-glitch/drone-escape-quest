import { vibrate } from "../audio/AudioManager";

/**
 * HapticManager — one place for every vibration in the game.
 * Respects the "haptics" setting and fails silently on devices (or browsers)
 * without the Vibration API.
 */
export const HapticManager = {
  light: () => vibrate(10),
  medium: () => vibrate(22),
  heavy: () => vibrate(45),
  success: () => vibrate([15, 40, 25]),
  warning: () => vibrate([30, 40, 30]),
};

export const haptics = HapticManager;
