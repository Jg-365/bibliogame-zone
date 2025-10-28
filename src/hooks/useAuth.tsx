// Re-export the canonical AuthProvider and useAuth from the providers
// implementation to avoid duplication and ensure a single source of
// truth for authentication behavior (session restore, token refresh,
// password reset, etc.). This prevents mismatched providers being
// mounted in different parts of the app which was causing hard-to-debug
// loading states after token expiry.
export {
  AuthProvider,
  useAuth,
} from "@/providers/AuthProvider";
