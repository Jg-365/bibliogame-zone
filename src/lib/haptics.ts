export const triggerHapticFeedback = (duration = 8) => {
  if (typeof window === "undefined") return;
  const canVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasUserActivation = (
    navigator as Navigator & {
      userActivation?: { isActive?: boolean };
    }
  ).userActivation?.isActive;

  if (canVibrate && isCoarsePointer && hasUserActivation !== false) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore browsers that block vibration without trusted user gesture.
    }
  }
};
