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
      blog_post_metrics: {
        Row: {
          avg_position: number | null
          blog_post_id: string | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          ctr: number | null
          id: string
          impressions: number | null
          raw_metrics: Json | null
          seo_score: number | null
          sessions: number | null
          snapshot_date: string
          time_on_page: number | null
        }
        Insert: {
          avg_position?: number | null
          blog_post_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          id?: string
          impressions?: number | null
          raw_metrics?: Json | null
          seo_score?: number | null
          sessions?: number | null
          snapshot_date: string
          time_on_page?: number | null
        }
        Update: {
          avg_position?: number | null
          blog_post_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          ctr?: number | null
          id?: string
          impressions?: number | null
          raw_metrics?: Json | null
          seo_score?: number | null
          sessions?: number | null
          snapshot_date?: string
          time_on_page?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_metrics_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_revisions: {
        Row: {
          blog_post_id: string | null
          content: Json | null
          content_text: string | null
          created_at: string | null
          created_by: string | null
          created_by_type: string | null
          id: string
          notes: string | null
          revision_type: string
        }
        Insert: {
          blog_post_id?: string | null
          content?: Json | null
          content_text?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_type?: string | null
          id?: string
          notes?: string | null
          revision_type: string
        }
        Update: {
          blog_post_id?: string | null
          content?: Json | null
          content_text?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_type?: string | null
          id?: string
          notes?: string | null
          revision_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_blog_post_id_fkey"
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
          content_batch_id: string | null
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
          seo_quality_score: number | null
          status: Database["public"]["Enums"]["blog_post_status"] | null
          target_audience: string | null
          target_keyword: string | null
          tone_of_voice: string | null
          topic: string
          topic_cluster_id: string | null
          updated_at: string | null
          word_count_goal: number | null
        }
        Insert: {
          client_id?: string | null
          cms_publish_info?: Json | null
          content_batch_id?: string | null
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
          seo_quality_score?: number | null
          status?: Database["public"]["Enums"]["blog_post_status"] | null
          target_audience?: string | null
          target_keyword?: string | null
          tone_of_voice?: string | null
          topic: string
          topic_cluster_id?: string | null
          updated_at?: string | null
          word_count_goal?: number | null
        }
        Update: {
          client_id?: string | null
          cms_publish_info?: Json | null
          content_batch_id?: string | null
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
          seo_quality_score?: number | null
          status?: Database["public"]["Enums"]["blog_post_status"] | null
          target_audience?: string | null
          target_keyword?: string | null
          tone_of_voice?: string | null
          topic?: string
          topic_cluster_id?: string | null
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
          {
            foreignKeyName: "blog_posts_content_batch_id_fkey"
            columns: ["content_batch_id"]
            isOneToOne: false
            referencedRelation: "content_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_topic_cluster_id_fkey"
            columns: ["topic_cluster_id"]
            isOneToOne: false
            referencedRelation: "topic_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_guides: {
        Row: {
          brand_name: string | null
          created_at: string | null
          donts: Json | null
          full_content: string | null
          id: string
          messaging_hierarchy: Json | null
          name: string
          products_services: Json | null
          source: string | null
          source_url: string | null
          tagline: string | null
          target_audiences: Json | null
          tone_guidelines: Json | null
          updated_at: string | null
          value_propositions: Json | null
          voice_traits: Json | null
        }
        Insert: {
          brand_name?: string | null
          created_at?: string | null
          donts?: Json | null
          full_content?: string | null
          id?: string
          messaging_hierarchy?: Json | null
          name: string
          products_services?: Json | null
          source?: string | null
          source_url?: string | null
          tagline?: string | null
          target_audiences?: Json | null
          tone_guidelines?: Json | null
          updated_at?: string | null
          value_propositions?: Json | null
          voice_traits?: Json | null
        }
        Update: {
          brand_name?: string | null
          created_at?: string | null
          donts?: Json | null
          full_content?: string | null
          id?: string
          messaging_hierarchy?: Json | null
          name?: string
          products_services?: Json | null
          source?: string | null
          source_url?: string | null
          tagline?: string | null
          target_audiences?: Json | null
          tone_guidelines?: Json | null
          updated_at?: string | null
          value_propositions?: Json | null
          voice_traits?: Json | null
        }
        Relationships: []
      }
      check_back_schedules: {
        Row: {
          blog_post_id: string | null
          check_back_type: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          scheduled_date: string
          status: string | null
        }
        Insert: {
          blog_post_id?: string | null
          check_back_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          scheduled_date: string
          status?: string | null
        }
        Update: {
          blog_post_id?: string | null
          check_back_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          scheduled_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_back_schedules_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
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
      comparison_tables: {
        Row: {
          brand_guide_id: string | null
          category: string | null
          columns: Json | null
          created_at: string | null
          description: string | null
          id: string
          rows: Json | null
          title: string
        }
        Insert: {
          brand_guide_id?: string | null
          category?: string | null
          columns?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          rows?: Json | null
          title: string
        }
        Update: {
          brand_guide_id?: string | null
          category?: string | null
          columns?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          rows?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_tables_brand_guide_id_fkey"
            columns: ["brand_guide_id"]
            isOneToOne: false
            referencedRelation: "brand_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      content_batches: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          goal_score_from: number | null
          goal_score_to: number | null
          id: string
          name: string
          posts_approved: number | null
          posts_completed: number | null
          posts_published: number | null
          start_date: string | null
          status: string | null
          total_posts: number | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          goal_score_from?: number | null
          goal_score_to?: number | null
          id?: string
          name: string
          posts_approved?: number | null
          posts_completed?: number | null
          posts_published?: number | null
          start_date?: string | null
          status?: string | null
          total_posts?: number | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          goal_score_from?: number | null
          goal_score_to?: number | null
          id?: string
          name?: string
          posts_approved?: number | null
          posts_completed?: number | null
          posts_published?: number | null
          start_date?: string | null
          status?: string | null
          total_posts?: number | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_batches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_batches_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      content_gaps: {
        Row: {
          affected_pages: Json | null
          created_at: string | null
          description: string | null
          gap_type: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          suggested_action: string | null
          title: string
          website_id: string | null
        }
        Insert: {
          affected_pages?: Json | null
          created_at?: string | null
          description?: string | null
          gap_type: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          suggested_action?: string | null
          title: string
          website_id?: string | null
        }
        Update: {
          affected_pages?: Json | null
          created_at?: string | null
          description?: string | null
          gap_type?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          suggested_action?: string | null
          title?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_gaps_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      content_requirements: {
        Row: {
          content_type: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          optional_elements: Json | null
          required_sections: Json | null
          seo_requirements: Json | null
          target_audience: string | null
          template_name: string
          tone: string | null
          word_count_range: Json | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          optional_elements?: Json | null
          required_sections?: Json | null
          seo_requirements?: Json | null
          target_audience?: string | null
          template_name: string
          tone?: string | null
          word_count_range?: Json | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          optional_elements?: Json | null
          required_sections?: Json | null
          seo_requirements?: Json | null
          target_audience?: string | null
          template_name?: string
          tone?: string | null
          word_count_range?: Json | null
        }
        Relationships: []
      }
      content_suggestions: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_impact: string | null
          estimated_word_count: number | null
          gap_id: string | null
          id: string
          outline: Json | null
          priority: number | null
          reasoning: string | null
          status: string | null
          suggestion_type: string
          target_keyword: string | null
          title: string
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_impact?: string | null
          estimated_word_count?: number | null
          gap_id?: string | null
          id?: string
          outline?: Json | null
          priority?: number | null
          reasoning?: string | null
          status?: string | null
          suggestion_type: string
          target_keyword?: string | null
          title: string
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_impact?: string | null
          estimated_word_count?: number | null
          gap_id?: string | null
          id?: string
          outline?: Json | null
          priority?: number | null
          reasoning?: string | null
          status?: string | null
          suggestion_type?: string
          target_keyword?: string | null
          title?: string
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_suggestions_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "content_gaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_suggestions_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          brand_guide_id: string | null
          category: string | null
          created_at: string | null
          id: string
          keywords: Json | null
          question: string
          usage_count: number | null
        }
        Insert: {
          answer: string
          brand_guide_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          keywords?: Json | null
          question: string
          usage_count?: number | null
        }
        Update: {
          answer?: string
          brand_guide_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          keywords?: Json | null
          question?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_brand_guide_id_fkey"
            columns: ["brand_guide_id"]
            isOneToOne: false
            referencedRelation: "brand_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      post_requirements: {
        Row: {
          blog_post_id: string | null
          brand_guide_id: string | null
          created_at: string | null
          custom_requirements: Json | null
          id: string
          include_comparison: boolean | null
          include_faqs: boolean | null
          include_statistics: boolean | null
          include_table: boolean | null
          selected_faqs: Json | null
          selected_products: Json | null
          selected_tables: Json | null
        }
        Insert: {
          blog_post_id?: string | null
          brand_guide_id?: string | null
          created_at?: string | null
          custom_requirements?: Json | null
          id?: string
          include_comparison?: boolean | null
          include_faqs?: boolean | null
          include_statistics?: boolean | null
          include_table?: boolean | null
          selected_faqs?: Json | null
          selected_products?: Json | null
          selected_tables?: Json | null
        }
        Update: {
          blog_post_id?: string | null
          brand_guide_id?: string | null
          created_at?: string | null
          custom_requirements?: Json | null
          id?: string
          include_comparison?: boolean | null
          include_faqs?: boolean | null
          include_statistics?: boolean | null
          include_table?: boolean | null
          selected_faqs?: Json | null
          selected_products?: Json | null
          selected_tables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "post_requirements_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_requirements_brand_guide_id_fkey"
            columns: ["brand_guide_id"]
            isOneToOne: false
            referencedRelation: "brand_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      products_services: {
        Row: {
          benefits: Json | null
          brand_guide_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          key_features: Json | null
          metadata: Json | null
          name: string
          pricing_info: string | null
          target_audience: string | null
          use_cases: Json | null
        }
        Insert: {
          benefits?: Json | null
          brand_guide_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key_features?: Json | null
          metadata?: Json | null
          name: string
          pricing_info?: string | null
          target_audience?: string | null
          use_cases?: Json | null
        }
        Update: {
          benefits?: Json | null
          brand_guide_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key_features?: Json | null
          metadata?: Json | null
          name?: string
          pricing_info?: string | null
          target_audience?: string | null
          use_cases?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_services_brand_guide_id_fkey"
            columns: ["brand_guide_id"]
            isOneToOne: false
            referencedRelation: "brand_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content_batch_id: string | null
          created_at: string | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          report_data: Json | null
          report_type: string
          storage_url: string | null
          website_id: string | null
        }
        Insert: {
          content_batch_id?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          report_data?: Json | null
          report_type: string
          storage_url?: string | null
          website_id?: string | null
        }
        Update: {
          content_batch_id?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json | null
          report_type?: string
          storage_url?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_content_batch_id_fkey"
            columns: ["content_batch_id"]
            isOneToOne: false
            referencedRelation: "content_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
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
      scraped_pages: {
        Row: {
          content: string | null
          description: string | null
          headings: Json | null
          html: string | null
          id: string
          images: Json | null
          links: Json | null
          metadata: Json | null
          scraped_at: string | null
          title: string | null
          url: string
          website_id: string | null
          word_count: number | null
        }
        Insert: {
          content?: string | null
          description?: string | null
          headings?: Json | null
          html?: string | null
          id?: string
          images?: Json | null
          links?: Json | null
          metadata?: Json | null
          scraped_at?: string | null
          title?: string | null
          url: string
          website_id?: string | null
          word_count?: number | null
        }
        Update: {
          content?: string | null
          description?: string | null
          headings?: Json | null
          html?: string | null
          id?: string
          images?: Json | null
          links?: Json | null
          metadata?: Json | null
          scraped_at?: string | null
          title?: string | null
          url?: string
          website_id?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scraped_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          audit_date: string | null
          baseline_score: number | null
          created_at: string | null
          id: string
          pages_indexed: number | null
          raw_metrics: Json | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          audit_date?: string | null
          baseline_score?: number | null
          created_at?: string | null
          id?: string
          pages_indexed?: number | null
          raw_metrics?: Json | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          audit_date?: string | null
          baseline_score?: number | null
          created_at?: string | null
          id?: string
          pages_indexed?: number | null
          raw_metrics?: Json | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_audits_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_clusters: {
        Row: {
          created_at: string | null
          currently_covered: boolean | null
          difficulty: number | null
          estimated_traffic: number | null
          id: string
          name: string
          primary_keyword: string
          recommended_article_count: number | null
          search_intent: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          currently_covered?: boolean | null
          difficulty?: number | null
          estimated_traffic?: number | null
          id?: string
          name: string
          primary_keyword: string
          recommended_article_count?: number | null
          search_intent?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          currently_covered?: boolean | null
          difficulty?: number | null
          estimated_traffic?: number | null
          id?: string
          name?: string
          primary_keyword?: string
          recommended_article_count?: number | null
          search_intent?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_clusters_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_documents: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          extracted_text: string | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          processed: boolean | null
          storage_path: string | null
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          extracted_text?: string | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          processed?: boolean | null
          storage_path?: string | null
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          extracted_text?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          processed?: boolean | null
          storage_path?: string | null
        }
        Relationships: []
      }
      website_insights: {
        Row: {
          analyzed_at: string | null
          id: string
          insight_type: string
          metric_name: string
          metric_value: Json | null
          recommendations: Json | null
          trend: string | null
          website_id: string | null
        }
        Insert: {
          analyzed_at?: string | null
          id?: string
          insight_type: string
          metric_name: string
          metric_value?: Json | null
          recommendations?: Json | null
          trend?: string | null
          website_id?: string | null
        }
        Update: {
          analyzed_at?: string | null
          id?: string
          insight_type?: string
          metric_name?: string
          metric_value?: Json | null
          recommendations?: Json | null
          trend?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_insights_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
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
      websites: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string
          id: string
          last_scraped_at: string | null
          metadata: Json | null
          pages_scraped: number | null
          scrape_status: string | null
          title: string | null
          total_pages_found: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          last_scraped_at?: string | null
          metadata?: Json | null
          pages_scraped?: number | null
          scrape_status?: string | null
          title?: string | null
          total_pages_found?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          last_scraped_at?: string | null
          metadata?: Json | null
          pages_scraped?: number | null
          scrape_status?: string | null
          title?: string | null
          total_pages_found?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
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
