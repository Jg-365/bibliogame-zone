import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/shared/utils";
import type { LoadingState } from "@/shared/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    userData?: { fullName?: string }
  ) => Promise<void>;
  signIn: (
    email: string,
    password: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: {
    fullName?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  loading: LoadingState;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(
    null
  );
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading({
            isLoading: false,
            error: getErrorMessage(error),
          });
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading({ isLoading: false, error: null });
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        setLoading({
          isLoading: false,
          error: getErrorMessage(error),
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          "Auth state changed:",
          event,
          session?.user?.id
        );

        setSession(session);
        setUser(session?.user ?? null);

        if (
          event === "SIGNED_OUT" ||
          (event === "TOKEN_REFRESHED" && !session)
        ) {
          setUser(null);
          setSession(null);
        }

        setLoading({ isLoading: false, error: null });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData?: { fullName?: string }
  ): Promise<void> => {
    setLoading({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.fullName,
          },
        },
      });

      if (error) throw error;

      // If user is created successfully, create profile
      if (data.user && !error) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: data.user.id,
            full_name: userData?.fullName,
            points: 0,
            level: "Iniciante",
            books_completed: 0,
            total_pages_read: 0,
            current_streak: 0,
            longest_streak: 0,
          });

        if (profileError) {
          console.error(
            "Error creating profile:",
            profileError
          );
          // Don't throw here, as the user was created successfully
        }
      }

      setLoading({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLoading({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<void> => {
    setLoading({ isLoading: true, error: null });

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;
      setLoading({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLoading({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setLoading({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLoading({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<void> => {
    setLoading({ isLoading: true, error: null });

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (error) throw error;
      setLoading({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLoading({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (updates: {
    fullName?: string;
    avatarUrl?: string;
  }): Promise<void> => {
    if (!user) throw new Error("Usuário não autenticado");

    setLoading({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        },
      });

      if (error) throw error;

      // Also update the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error(
          "Error updating profile:",
          profileError
        );
      }

      setLoading({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLoading({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth deve ser usado dentro de um AuthProvider"
    );
  }
  return context;
};
