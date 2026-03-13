import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env.local and fill in your project credentials.",
  );
}

const isDashboardUrl = SUPABASE_URL.includes("supabase.com/dashboard");
const isSupabaseApiUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL);

if (isDashboardUrl || !isSupabaseApiUrl) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: "${SUPABASE_URL}". Use the API URL format "https://<project-ref>.supabase.co" from Supabase Settings > API.`,
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// In order to support a per-user "remember me" behaviour we provide a
// conditional storage adapter. When the user has chosen to be remembered
// (localStorage key `rq_remember` === 'true') we persist the auth tokens to
// localStorage. Otherwise we keep them in an in-memory Map so the session
// is lost on page reload (no persistent session) which avoids the loader
// getting stuck when the user didn't select "Lembrar de mim".
const inMemoryStorage = new Map<string, string>();

const conditionalStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window === "undefined") {
        return inMemoryStorage.get(key) ?? null;
      }
      const remember = localStorage.getItem("rq_remember");
      if (remember === "true") {
        return localStorage.getItem(key);
      }
      return inMemoryStorage.get(key) ?? null;
    } catch (e) {
      return inMemoryStorage.get(key) ?? null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window === "undefined") {
        inMemoryStorage.set(key, value);
        return;
      }
      const remember = localStorage.getItem("rq_remember");
      if (remember === "true") {
        localStorage.setItem(key, value);
      } else {
        inMemoryStorage.set(key, value);
      }
    } catch (e) {
      inMemoryStorage.set(key, value);
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // ignore
    }
    inMemoryStorage.delete(key);
  },
  // Remove all keys from both storages
  clear: () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    } catch (e) {
      // ignore
    }
    inMemoryStorage.clear();
  },
  // Return the key at index (to mimic Storage.key)
  key: (index: number) => {
    try {
      if (typeof window !== "undefined") {
        // If user prefers persistence, delegate to localStorage keys
        const remember = localStorage.getItem("rq_remember");
        if (remember === "true") {
          return localStorage.key(index);
        }
      }
    } catch (e) {
      // ignore
    }
    const keys = Array.from(inMemoryStorage.keys());
    return keys[index] ?? null;
  },
  // Length property to mimic Storage.length
  get length() {
    try {
      if (typeof window !== "undefined") {
        const remember = localStorage.getItem("rq_remember");
        if (remember === "true") {
          return localStorage.length;
        }
      }
    } catch (e) {
      // ignore
    }
    return inMemoryStorage.size;
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: conditionalStorage as any,
    persistSession: true,
    autoRefreshToken: true,
  },
});
