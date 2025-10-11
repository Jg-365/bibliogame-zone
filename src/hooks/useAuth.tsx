import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  checkAccountStatus: () => Promise<boolean>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to check if account is deleted
    const checkAccountStatus = async (user: User) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("level, full_name")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking profile:", error);
          return true; // Allow access if we can't check
        }

        // If account is marked as deleted, sign out immediately
        if (
          profile?.level === "DELETADA" ||
          profile?.full_name === "CONTA_DELETADA"
        ) {
          console.log(
            "🚫 Conta deletada detectada, fazendo logout..."
          );
          await supabase.auth.signOut();

          // Clear all local storage
          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
          }

          return false;
        }

        return true;
      } catch (error) {
        console.error(
          "Error in checkAccountStatus:",
          error
        );
        return true; // Allow access if there's an error
      }
    };

    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          "🔐 Auth state changed:",
          event,
          session?.user?.id
        );

        // Respect 'remember me' preference
        const remember =
          typeof window !== "undefined"
            ? localStorage.getItem("rq_remember")
            : null;

        // Only, and explicitly, preserve sessions when remember === 'true'.
        // Any other value (null/undefined/'false') means the session is
        // non-persistent and will be stored in-memory by the client.

        // Handle specific lifecycle events
        if (
          event === "SIGNED_OUT" ||
          event === "TOKEN_REFRESHED"
        ) {
          if (session?.user) {
            const isValid = await checkAccountStatus(
              session.user
            );
            if (isValid) {
              setSession(session);
              setUser(session.user);
            } else {
              setSession(null);
              setUser(null);
            }
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
        } else {
          // For SIGNED_IN and other events, trust AuthPage validation
          setSession(session);
          setUser(session?.user ?? null);
        }

        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        try {
          const remember =
            typeof window !== "undefined"
              ? localStorage.getItem("rq_remember")
              : null;

          if (session?.user) {
            // If the session exists but the user didn't choose persistent
            // storage (remember !== 'true') we still allow the in-memory
            // session to be used for this page load. Avoid forcing a
            // signOut here to prevent races with auth state changes.

            // Check if account is deleted for existing sessions
            const isValid = await checkAccountStatus(
              session.user
            );
            if (isValid) {
              setSession(session);
              setUser(session.user);
            } else {
              // Account was deleted, sign out
              setSession(null);
              setUser(null);
            }
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
        } catch (err) {
          console.error("Error restoring session:", err);
          setSession(null);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Function to check if account is deleted - can be called from other components
  const checkAccountStatus =
    useCallback(async (): Promise<boolean> => {
      if (!user) return true;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("level, full_name")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking profile:", error);
          return true; // Allow access if we can't check
        }

        // If account is marked as deleted, sign out immediately
        if (
          profile?.level === "DELETADA" ||
          profile?.full_name === "CONTA_DELETADA"
        ) {
          console.log(
            "🚫 Conta deletada detectada durante verificação, fazendo logout..."
          );
          await supabase.auth.signOut();

          // Clear all local storage
          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
          }

          return false;
        }

        return true;
      } catch (error) {
        console.error(
          "Error in checkAccountStatus:",
          error
        );
        return true; // Allow access if there's an error
      }
    }, [user]);

  const value = {
    user,
    session,
    isLoading,
    signOut,
    checkAccountStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
