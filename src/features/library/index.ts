/**
 * Library feature — barrel re-export
 *
 * This module groups all library-related components and the hook.
 * Components live at @/components/* for now; this barrel provides the
 * feature-scoped import path `@/features/library` for new code.
 *
 * Incremental MT-3 migration: existing imports still work without change.
 */

// Components
export { BookCard } from "@/components/BookCard";
export { BookActions } from "@/components/BookActions";
export { BookActionButtons } from "@/components/BookActionButtons";
export { BookLibrary } from "@/components/BookLibrary";

// Hook
export { useBooks, searchGoogleBooks } from "@/hooks/useBooks";
export { searchGoogleBooks as searchBooks } from "@/integrations/googleBooks/client";
