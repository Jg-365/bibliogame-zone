/**
 * Social feature — barrel re-export
 *
 * Groups social-feed components. Uses MT-1 consolidated social hooks.
 */

// Components
export { PostCard } from "@/components/PostCard";
export { CreatePost } from "@/components/CreatePost";
export { ActivityFeed } from "@/components/ActivityFeed";
export { SocialSection } from "@/components/SocialSection";

// Hooks (from MT-1 consolidated barrel)
export { usePosts, usePostComments, useImageUpload } from "@/hooks/social";
export {
  useFollows,
  useFollowUser,
  useUnfollowUser,
  useIsFollowing,
  useActivity,
} from "@/hooks/social";
