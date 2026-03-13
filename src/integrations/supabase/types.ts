export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string;
          description: string;
          icon: string;
          id: string;
          rarity: string;
          requirement_type: string;
          requirement_value: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          icon: string;
          id?: string;
          rarity?: string;
          requirement_type: string;
          requirement_value: number;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          rarity?: string;
          requirement_type?: string;
          requirement_value?: number;
          title?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          author: string;
          cover_url: string | null;
          created_at: string;
          date_added: string;
          date_completed: string | null;
          description: string | null;
          genres: string[] | null;
          google_books_id: string | null;
          id: string;
          is_favorite: boolean | null;
          isbn: string | null;
          pages_read: number | null;
          published_date: string | null;
          rating: number | null;
          reading_started_at: string | null;
          review: string | null;
          status: string;
          title: string;
          total_pages: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          author: string;
          cover_url?: string | null;
          created_at?: string;
          date_added?: string;
          date_completed?: string | null;
          description?: string | null;
          genres?: string[] | null;
          google_books_id?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          isbn?: string | null;
          pages_read?: number | null;
          published_date?: string | null;
          rating?: number | null;
          reading_started_at?: string | null;
          review?: string | null;
          status?: string;
          title: string;
          total_pages: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          author?: string;
          cover_url?: string | null;
          created_at?: string;
          date_added?: string;
          date_completed?: string | null;
          description?: string | null;
          genres?: string[] | null;
          google_books_id?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          isbn?: string | null;
          pages_read?: number | null;
          published_date?: string | null;
          rating?: number | null;
          reading_started_at?: string | null;
          review?: string | null;
          status?: string;
          title?: string;
          total_pages?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string | null;
          daily_reading_reminder: boolean | null;
          email_notifications_enabled: boolean | null;
          id: string;
          notify_on_comment: boolean | null;
          notify_on_follow: boolean | null;
          notify_on_like: boolean | null;
          notify_on_post: boolean | null;
          reminder_time: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          daily_reading_reminder?: boolean | null;
          email_notifications_enabled?: boolean | null;
          id?: string;
          notify_on_comment?: boolean | null;
          notify_on_follow?: boolean | null;
          notify_on_like?: boolean | null;
          notify_on_post?: boolean | null;
          reminder_time?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          daily_reading_reminder?: boolean | null;
          email_notifications_enabled?: boolean | null;
          id?: string;
          notify_on_comment?: boolean | null;
          notify_on_follow?: boolean | null;
          notify_on_like?: boolean | null;
          notify_on_post?: boolean | null;
          reminder_time?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_queue: {
        Row: {
          created_at: string | null;
          data: Json | null;
          id: string;
          notification_type: string;
          related_entity_id: string | null;
          related_entity_type: string | null;
          sent: boolean | null;
          sent_at: string | null;
          trigger_user_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          notification_type: string;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          sent?: boolean | null;
          sent_at?: string | null;
          trigger_user_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          notification_type?: string;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          sent?: boolean | null;
          sent_at?: string | null;
          trigger_user_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          post_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          post_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          post_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          banner_preset_id: string | null;
          banner_url: string | null;
          bio: string | null;
          books_completed: number | null;
          created_at: string;
          current_book_id: string | null;
          current_streak: number | null;
          daily_page_goal: number | null;
          experience_points: number | null;
          favorite_genres: string[] | null;
          freeze_used_dates: string[] | null;
          full_name: string | null;
          id: string;
          last_activity_date: string | null;
          last_freeze_earned: string | null;
          level: string | null;
          longest_streak: number | null;
          points: number | null;
          preferred_genres: string[] | null;
          reading_level: number | null;
          reading_speed: number | null;
          streak_freezes: number | null;
          streak_goal: number | null;
          total_books_read: number | null;
          total_pages_read: number | null;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          banner_preset_id?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          books_completed?: number | null;
          created_at?: string;
          current_book_id?: string | null;
          current_streak?: number | null;
          daily_page_goal?: number | null;
          experience_points?: number | null;
          favorite_genres?: string[] | null;
          freeze_used_dates?: string[] | null;
          full_name?: string | null;
          id?: string;
          last_activity_date?: string | null;
          last_freeze_earned?: string | null;
          level?: string | null;
          longest_streak?: number | null;
          points?: number | null;
          preferred_genres?: string[] | null;
          reading_level?: number | null;
          reading_speed?: number | null;
          streak_freezes?: number | null;
          streak_goal?: number | null;
          total_books_read?: number | null;
          total_pages_read?: number | null;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          banner_preset_id?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          books_completed?: number | null;
          created_at?: string;
          current_book_id?: string | null;
          current_streak?: number | null;
          daily_page_goal?: number | null;
          experience_points?: number | null;
          favorite_genres?: string[] | null;
          freeze_used_dates?: string[] | null;
          full_name?: string | null;
          id?: string;
          last_activity_date?: string | null;
          last_freeze_earned?: string | null;
          level?: string | null;
          longest_streak?: number | null;
          points?: number | null;
          preferred_genres?: string[] | null;
          reading_level?: number | null;
          reading_speed?: number | null;
          streak_freezes?: number | null;
          streak_goal?: number | null;
          total_books_read?: number | null;
          total_pages_read?: number | null;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_current_book_id_fkey";
            columns: ["current_book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_sessions: {
        Row: {
          book_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          pages_read: number;
          session_date: string;
          user_id: string;
        };
        Insert: {
          book_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          pages_read: number;
          session_date?: string;
          user_id: string;
        };
        Update: {
          book_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          pages_read?: number;
          session_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      social_posts: {
        Row: {
          book_id: string | null;
          comments_count: number | null;
          content: string;
          created_at: string | null;
          id: string;
          image_url: string | null;
          likes_count: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          book_id?: string | null;
          comments_count?: number | null;
          content: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          likes_count?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          book_id?: string | null;
          comments_count?: number | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          likes_count?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_posts_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      streak_milestones: {
        Row: {
          achieved_at: string | null;
          created_at: string | null;
          id: string;
          milestone_type: string;
          shared_to_feed: boolean | null;
          streak_value: number;
          user_id: string;
        };
        Insert: {
          achieved_at?: string | null;
          created_at?: string | null;
          id?: string;
          milestone_type: string;
          shared_to_feed?: boolean | null;
          streak_value: number;
          user_id: string;
        };
        Update: {
          achieved_at?: string | null;
          created_at?: string | null;
          id?: string;
          milestone_type?: string;
          shared_to_feed?: boolean | null;
          streak_value?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_and_grant_achievements: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      check_broken_streaks: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_post_comments: {
        Args: { p_post_id: string };
        Returns: {
          content: string;
          created_at: string;
          id: string;
          updated_at: string;
          user_avatar_url: string;
          user_id: string;
          user_username: string;
        }[];
      };
      get_social_posts_feed: {
        Args: { p_limit?: number; p_offset?: number; p_user_id?: string };
        Returns: {
          book_author: string;
          book_cover_url: string;
          book_id: string;
          book_title: string;
          comments_count: number;
          content: string;
          created_at: string;
          id: string;
          image_url: string;
          is_liked: boolean;
          likes_count: number;
          updated_at: string;
          user_avatar_url: string;
          user_id: string;
          user_username: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
