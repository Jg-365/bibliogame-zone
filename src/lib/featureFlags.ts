import { useMemo } from "react";

const DEFAULT_FLAGS = {
  enableAiCopilot: true,
  enableReadingFocusTimer: true,
  enableWeeklyGoal: true,
  enableRetentionMetrics: true,
  enableSmartRecommendations: true,
};

type Flags = typeof DEFAULT_FLAGS;
type FlagKey = keyof Flags;

const parseEnvFlag = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const getFlagFromStorage = (flag: FlagKey): boolean | null => {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(`rq:flag:${flag}`);
    if (value === null) return null;
    return parseEnvFlag(value, DEFAULT_FLAGS[flag]);
  } catch {
    return null;
  }
};

export const resolveFeatureFlags = (): Flags => {
  const envFlags: Flags = {
    enableAiCopilot: parseEnvFlag(
      import.meta.env.VITE_FF_AI_COPILOT,
      DEFAULT_FLAGS.enableAiCopilot,
    ),
    enableReadingFocusTimer: parseEnvFlag(
      import.meta.env.VITE_FF_READING_FOCUS_TIMER,
      DEFAULT_FLAGS.enableReadingFocusTimer,
    ),
    enableWeeklyGoal: parseEnvFlag(
      import.meta.env.VITE_FF_WEEKLY_GOAL,
      DEFAULT_FLAGS.enableWeeklyGoal,
    ),
    enableRetentionMetrics: parseEnvFlag(
      import.meta.env.VITE_FF_RETENTION_METRICS,
      DEFAULT_FLAGS.enableRetentionMetrics,
    ),
    enableSmartRecommendations: parseEnvFlag(
      import.meta.env.VITE_FF_SMART_RECOMMENDATIONS,
      DEFAULT_FLAGS.enableSmartRecommendations,
    ),
  };

  const merged = { ...envFlags };
  (Object.keys(DEFAULT_FLAGS) as FlagKey[]).forEach((key) => {
    const storageOverride = getFlagFromStorage(key);
    if (storageOverride !== null) merged[key] = storageOverride;
  });
  return merged;
};

export const useFeatureFlags = () => useMemo(resolveFeatureFlags, []);

export const useFeatureFlag = (flag: FlagKey) => {
  const flags = useFeatureFlags();
  return flags[flag];
};
