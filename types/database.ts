export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_name: string
          blog_post_id: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          input_summary: Json | null
          output_summary: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          agent_name: string
          blog_post_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_summary?: Json | null
          output_summary?: Json | null
          started_at?: string | null
          status: string
        }
        Update: {
          agent_name?: string
          blog_post_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_summary?: Json | null
          output_summary?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_sections: {
        Row: {
          ai_content: Json | null
          blog_post_id: string | null
          content: string | null
          created_at: string | null
          human_prompt: string | null
          id: string
          needs_human: boolean | null
          order_index: number
          section_key: string
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          ai_content?: Json | null
          blog_post_id?: string | null
          content?: string | null
          created_at?: string | null
          human_prompt?: string | null
          id?: string
          needs_human?: boolean | null
          order_index: number
          section_key: string
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_content?: Json | null
          blog_post_id?: string | null
          content?: string | null
          created_at?: string | null
          human_prompt?: string | null
          id?: string
          needs_human?: boolean | null
          order_index?: number
          section_key?: string
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_sections_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          client_id: string | null
          cms_publish_info: Json | null
          created_at: string | null
          draft: Json | null
          final_html: string | null
          goal: string | null
          id: string
          image_briefs: Json | null
          outline: Json | null
          research_context: Json | null
          seo_metadata: Json | null
          seo_notes: string | null
          status: Database["public"]["Enums"]["blog_post_status"] | null
          target_audience: string | null
          target_keyword: string | null
          tone_of_voice: string | null
          topic: string
          updated_at: string | null
          word_count_goal: number | null
        }
        Insert: {
          client_id?: string | null
          cms_publish_info?: Json | null
          created_at?: string | null
          draft?: Json | null
          final_html?: string | null
          goal?: string | null
          id?: string
          image_briefs?: Json | null
          outline?: Json | null
          research_context?: Json | null
          seo_metadata?: Json | null
          seo_notes?: string | null
          status?: Database["public"]["Enums"]["blog_post_status"] | null
          target_audience?: string | null
          target_keyword?: string | null
          tone_of_voice?: string | null
          topic: string
          updated_at?: string | null
          word_count_goal?: number | null
        }
        Update: {
          client_id?: string | null
          cms_publish_info?: Json | null
          created_at?: string | null
          draft?: Json | null
          final_html?: string | null
          goal?: string | null
          id?: string
          image_briefs?: Json | null
          outline?: Json | null
          research_context?: Json | null
          seo_metadata?: Json | null
          seo_notes?: string | null
          status?: Database["public"]["Enums"]["blog_post_status"] | null
          target_audience?: string | null
          target_keyword?: string | null
          tone_of_voice?: string | null
          topic?: string
          updated_at?: string | null
          word_count_goal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          acquisition_channels: Json | null
          client_id: string | null
          competitors: string | null
          extra_notes: string | null
          id: string
          keywords: Json | null
          locations: Json | null
          positioning: string | null
          product_service_summary: string | null
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string | null
        }
        Insert: {
          acquisition_channels?: Json | null
          client_id?: string | null
          competitors?: string | null
          extra_notes?: string | null
          id?: string
          keywords?: Json | null
          locations?: Json | null
          positioning?: string | null
          product_service_summary?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
        }
        Update: {
          acquisition_channels?: Json | null
          client_id?: string | null
          competitors?: string | null
          extra_notes?: string | null
          id?: string
          keywords?: Json | null
          locations?: Json | null
          positioning?: string | null
          product_service_summary?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          has_website: boolean | null
          id: string
          name: string
          owner_id: string
          primary_contact_email: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          has_website?: boolean | null
          id?: string
          name: string
          owner_id: string
          primary_contact_email?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          has_website?: boolean | null
          id?: string
          name?: string
          owner_id?: string
          primary_contact_email?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      cms_connections: {
        Row: {
          auth_payload: Json
          base_url: string
          client_id: string | null
          cms_type: string
          created_at: string | null
          id: string
        }
        Insert: {
          auth_payload: Json
          base_url: string
          client_id?: string | null
          cms_type: string
          created_at?: string | null
          id?: string
        }
        Update: {
          auth_payload?: Json
          base_url?: string
          client_id?: string | null
          cms_type?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_name: string | null
          blog_post_id: string | null
          content: string
          created_at: string | null
          id: string
          resolved: boolean | null
          section_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          blog_post_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          resolved?: boolean | null
          section_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          blog_post_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          resolved?: boolean | null
          section_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "blog_post_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      review_tasks: {
        Row: {
          assigned_to: string | null
          blog_post_id: string | null
          created_at: string | null
          description: string
          id: string
          section_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          blog_post_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          section_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          blog_post_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          section_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_tasks_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "blog_post_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      website_pages: {
        Row: {
          clean_text: string | null
          client_id: string | null
          crawl_job_id: string | null
          created_at: string | null
          html: string | null
          id: string
          title: string | null
          url: string
        }
        Insert: {
          clean_text?: string | null
          client_id?: string | null
          crawl_job_id?: string | null
          created_at?: string | null
          html?: string | null
          id?: string
          title?: string | null
          url: string
        }
        Update: {
          clean_text?: string | null
          client_id?: string | null
          crawl_job_id?: string | null
          created_at?: string | null
          html?: string | null
          id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      blog_post_status:
        | "idea"
        | "researching"
        | "outlining"
        | "drafting"
        | "editing"
        | "needs_human_input"
        | "ready_for_review"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected"
        | "research_failed"
        | "outline_failed"
        | "draft_failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      blog_post_status: [
        "idea",
        "researching",
        "outlining",
        "drafting",
        "editing",
        "needs_human_input",
        "ready_for_review",
        "approved",
        "scheduled",
        "published",
        "rejected",
        "research_failed",
        "outline_failed",
        "draft_failed",
      ],
    },
  },
} as const

// Export BlogPostStatus type for convenience
export type BlogPostStatus = Database["public"]["Enums"]["blog_post_status"]
