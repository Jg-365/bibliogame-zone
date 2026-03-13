/**
 * Social hooks barrel — canonical module for all social domain logic.
 *
 * Consumers should import from here:
 *   import { usePosts, useLeaderboard, useActivities } from "@/hooks/social";
 *
 * The individual legacy files (`useSocial`, `useEnhancedSocial`,
 * `usePostsOptimized`) re-export everything from here for backward
 * compatibility and can be removed in a future cleanup.
 */

export * from "./graph";
export * from "./posts";
export { useLeaderboardHash } from "./graph";
export * from "./enhanced";
