# Entity-Relationship Diagram

```mermaid
erDiagram
    CLIENTS {
        uuid id PK
        uuid owner_id FK
        text name
        text primary_contact_email
        text website_url
        boolean has_website
        timestamptz created_at
    }

    CLIENTS }o--|| AUTH : "references"
    CLIENT_PROFILES {
        uuid id PK
        uuid client_id FK
        text product_service_summary
        text target_audience
        text positioning
        text tone_of_voice
        text competitors
        jsonb keywords
        jsonb locations
        jsonb acquisition_channels
        text extra_notes
        timestamptz updated_at
    }

    CLIENT_PROFILES }o--|| CLIENTS : "references"
    WEBSITE_PAGES {
        uuid id PK
        uuid client_id FK
        text url
        text title
        text html
        text clean_text
        uuid crawl_job_id
        timestamptz created_at
    }

    WEBSITE_PAGES }o--|| CLIENTS : "references"
    BLOG_POSTS {
        uuid id PK
        uuid client_id FK
        text topic
        text target_keyword
        blog_post_status status
        text tone_of_voice
        text target_audience
        int word_count_goal
        text goal
        text seo_notes
        jsonb research_context
        jsonb outline
        jsonb draft
        jsonb seo_metadata
        jsonb image_briefs
        text final_html
        jsonb cms_publish_info
        timestamptz created_at
        timestamptz updated_at
    }

    BLOG_POSTS }o--|| CLIENTS : "references"
    BLOG_POST_SECTIONS {
        uuid id PK
        uuid blog_post_id FK
        text section_key
        text title
        text type
        int order_index
        text content
        jsonb ai_content
        boolean needs_human
        text human_prompt
        timestamptz created_at
        timestamptz updated_at
    }

    BLOG_POST_SECTIONS }o--|| BLOG_POSTS : "references"
    AGENT_RUNS {
        uuid id PK
        uuid blog_post_id FK
        text agent_name
        text status
        jsonb input_summary
        jsonb output_summary
        text error_message
        timestamptz started_at
        timestamptz finished_at
    }

    AGENT_RUNS }o--|| BLOG_POSTS : "references"
    REVIEW_TASKS {
        uuid id PK
        uuid blog_post_id FK
        uuid section_id FK
        text status
        text description
        uuid assigned_to
        timestamptz created_at
        timestamptz updated_at
    }

    REVIEW_TASKS }o--|| BLOG_POSTS : "references"
    REVIEW_TASKS }o--|| BLOG_POST_SECTIONS : "references"
    COMMENTS {
        uuid id PK
        uuid blog_post_id FK
        uuid section_id FK
        uuid user_id
        text author_name
        text content
        boolean resolved
        timestamptz created_at
        timestamptz updated_at
    }

    COMMENTS }o--|| BLOG_POSTS : "references"
    COMMENTS }o--|| BLOG_POST_SECTIONS : "references"
    CMS_CONNECTIONS {
        UUID id PK
        UUID client_id FK
        TEXT cms_type
        TEXT base_url
        JSONB auth_payload
        TIMESTAMP created_at
        TEXT connection_status
        TIMESTAMP last_tested_at
        JSONB test_result
        TIMESTAMP updated_at
        UUID created_by FK
    }

    CMS_CONNECTIONS }o--|| CLIENTS : "references"
    CMS_CONNECTIONS }o--|| AUTH : "references"
    BRAND_GUIDES {
        UUID id PK
        TEXT name
        TEXT source
        TEXT source_url
        TEXT brand_name
        TEXT tagline
        JSONB voice_traits
        JSONB tone_guidelines
        JSONB messaging_hierarchy
        JSONB donts
        JSONB products_services
        JSONB target_audiences
        JSONB value_propositions
        TEXT full_content
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    PRODUCTS_SERVICES {
        UUID id PK
        UUID brand_guide_id FK
        TEXT name
        TEXT description
        TEXT category
        JSONB key_features
        JSONB benefits
        TEXT pricing_info
        JSONB use_cases
        TEXT target_audience
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    PRODUCTS_SERVICES }o--|| BRAND_GUIDES : "references"
    FAQS {
        UUID id PK
        UUID brand_guide_id FK
        TEXT category
        TEXT question
        TEXT answer
        JSONB keywords
        INTEGER usage_count
        TIMESTAMPTZ created_at
    }

    FAQS }o--|| BRAND_GUIDES : "references"
    COMPARISON_TABLES {
        UUID id PK
        UUID brand_guide_id FK
        TEXT title
        TEXT description
        JSONB columns
        JSONB rows
        TEXT category
        TIMESTAMPTZ created_at
    }

    COMPARISON_TABLES }o--|| BRAND_GUIDES : "references"
    CONTENT_REQUIREMENTS {
        UUID id PK
        TEXT template_name
        TEXT content_type
        JSONB required_sections
        JSONB optional_elements
        JSONB word_count_range
        JSONB seo_requirements
        TEXT tone
        TEXT target_audience
        BOOLEAN is_default
        TIMESTAMPTZ created_at
    }

    POST_REQUIREMENTS {
        UUID id PK
        UUID blog_post_id FK
        UUID brand_guide_id FK
        BOOLEAN include_faqs
        BOOLEAN include_table
        BOOLEAN include_comparison
        BOOLEAN include_statistics
        JSONB custom_requirements
        JSONB selected_products
        JSONB selected_faqs
        JSONB selected_tables
        TIMESTAMPTZ created_at
    }

    POST_REQUIREMENTS }o--|| BLOG_POSTS : "references"
    POST_REQUIREMENTS }o--|| BRAND_GUIDES : "references"
    UPLOADED_DOCUMENTS {
        UUID id PK
        TEXT filename
        TEXT file_type
        INTEGER file_size
        TEXT storage_path
        TEXT extracted_text
        JSONB analysis_result
        BOOLEAN processed
        TIMESTAMPTZ created_at
    }

    PROFILES {
        UUID id PK,FK
        TEXT email UK
        TEXT full_name
        TEXT avatar_url
        TEXT role
        UUID client_id
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TEXT company
    }

    PROFILES }o--|| AUTH : "references"
    CLIENT_NOTIFICATION_PREFERENCES {
        UUID id PK
        UUID client_id FK
        BOOLEAN notify_on_draft_ready
        BOOLEAN notify_before_publish
        INTEGER notify_hours_before
        BOOLEAN weekly_summary
        TIMESTAMPTZ created_at
    }

    CLIENT_NOTIFICATION_PREFERENCES }o--|| CLIENTS : "references"
    ACTIVITY_LOG {
        UUID id PK
        UUID client_id FK
        UUID user_id FK
        UUID blog_post_id FK
        TEXT action
        JSONB details
        TIMESTAMPTZ created_at
    }

    ACTIVITY_LOG }o--|| CLIENTS : "references"
    ACTIVITY_LOG }o--|| PROFILES : "references"
    ACTIVITY_LOG }o--|| BLOG_POSTS : "references"
    WEBSITES {
        UUID id PK
        TEXT url UK
        TEXT domain
        TEXT title
        TEXT description
        TEXT scrape_status
        INTEGER pages_scraped
        INTEGER total_pages_found
        TIMESTAMPTZ last_scraped_at
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SCRAPED_PAGES {
        UUID id PK
        UUID website_id FK
        TEXT url
        TEXT title
        TEXT description
        TEXT content
        TEXT html
        INTEGER word_count
        JSONB headings
        JSONB links
        JSONB images
        JSONB metadata
        TIMESTAMPTZ scraped_at
    }

    SCRAPED_PAGES }o--|| WEBSITES : "references"
    CONTENT_GAPS {
        UUID id PK
        UUID website_id FK
        TEXT gap_type
        TEXT severity
        TEXT title
        TEXT description
        TEXT suggested_action
        JSONB affected_pages
        JSONB metadata
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ resolved_at
    }

    CONTENT_GAPS }o--|| WEBSITES : "references"
    CONTENT_SUGGESTIONS {
        UUID id PK
        UUID website_id FK
        UUID gap_id FK
        TEXT suggestion_type
        TEXT title
        TEXT description
        TEXT estimated_impact
        TEXT target_keyword
        INTEGER estimated_word_count
        JSONB outline
        TEXT reasoning
        INTEGER priority
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CONTENT_SUGGESTIONS }o--|| WEBSITES : "references"
    CONTENT_SUGGESTIONS }o--|| CONTENT_GAPS : "references"
    WEBSITE_INSIGHTS {
        UUID id PK
        UUID website_id FK
        TEXT insight_type
        TEXT metric_name
        JSONB metric_value
        TEXT trend
        JSONB recommendations
        TIMESTAMPTZ analyzed_at
    }

    WEBSITE_INSIGHTS }o--|| WEBSITES : "references"
    CLIENT_INVITATIONS {
        UUID id PK
        UUID client_id FK
        TEXT email
        TEXT token UK
        TEXT role
        UUID invited_by FK
        TEXT status
        TIMESTAMPTZ accepted_at
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CLIENT_INVITATIONS }o--|| CLIENTS : "references"
    CLIENT_INVITATIONS }o--|| PROFILES : "references"
    NEWSLETTER_TEMPLATES {
        UUID id PK
        UUID vendor_id FK
        TEXT name
        TEXT description
        TEXT html_content
        JSONB json_content
        TEXT thumbnail_url
        BOOLEAN is_system_template
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    NEWSLETTER_TEMPLATES }o--|| VENDORS : "references"
    NEWSLETTER_CAMPAIGNS {
        UUID id PK
        UUID vendor_id FK
        UUID template_id FK
        TEXT subject
        TEXT preview_text
        TEXT html_content
        JSONB json_content
        TEXT status
        TIMESTAMPTZ scheduled_at
        TIMESTAMPTZ sent_at
        INT recipient_count
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    NEWSLETTER_CAMPAIGNS }o--|| VENDORS : "references"
    NEWSLETTER_CAMPAIGNS }o--|| NEWSLETTER_TEMPLATES : "references"
    NEWSLETTER_RECIPIENTS {
        UUID id PK
        UUID campaign_id FK
        TEXT email
        UUID client_id FK
        TEXT status
        TIMESTAMPTZ sent_at
        TIMESTAMPTZ opened_at
        TIMESTAMPTZ clicked_at
        TIMESTAMPTZ created_at
    }

    NEWSLETTER_RECIPIENTS }o--|| NEWSLETTER_CAMPAIGNS : "references"
    NEWSLETTER_RECIPIENTS }o--|| CLIENTS : "references"
    NEWSLETTER_AUTOMATIONS {
        UUID id PK
        UUID vendor_id FK
        UUID template_id FK
        VARCHAR(255) name
        TEXT description
        VARCHAR(50) trigger_type
        JSONB trigger_config
        VARCHAR(255) subject
        TEXT preview_text
        TEXT html_content
        JSONB json_content
        VARCHAR(50) recipient_selection
        JSONB recipient_config
        BOOLEAN enabled
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ last_executed_at
        TIMESTAMPTZ next_execution_at
        INTEGER execution_count
    }

    NEWSLETTER_AUTOMATIONS }o--|| VENDORS : "references"
    NEWSLETTER_AUTOMATIONS }o--|| NEWSLETTER_TEMPLATES : "references"
    NEWSLETTER_AUTOMATION_EXECUTIONS {
        UUID id PK
        UUID automation_id FK
        UUID campaign_id FK
        TIMESTAMPTZ executed_at
        VARCHAR(50) status
        TEXT error_message
        INTEGER recipients_count
        INTEGER emails_sent
        INTEGER emails_failed
    }

    NEWSLETTER_AUTOMATION_EXECUTIONS }o--|| NEWSLETTER_AUTOMATIONS : "references"
    NEWSLETTER_AUTOMATION_EXECUTIONS }o--|| NEWSLETTER_CAMPAIGNS : "references"
    STRIPE_ACCOUNTS {
        UUID id PK
        UUID vendor_id FK
        TEXT stripe_account_id UK
        TEXT stripe_customer_id
        BOOLEAN is_connected
        BOOLEAN livemode
        TEXT account_type
        BOOLEAN charges_enabled
        BOOLEAN payouts_enabled
        BOOLEAN details_submitted
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    STRIPE_ACCOUNTS }o--|| AUTH : "references"
    SUBSCRIPTION_PLANS {
        UUID id PK
        UUID vendor_id FK
        TEXT stripe_price_id
        TEXT stripe_product_id
        TEXT name
        TEXT description
        INTEGER amount
        TEXT currency
        TEXT interval
        INTEGER interval_count
        BOOLEAN is_active
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SUBSCRIPTION_PLANS }o--|| AUTH : "references"
    SUBSCRIPTIONS {
        UUID id PK
        UUID client_id FK
        UUID subscription_plan_id FK
        TEXT stripe_subscription_id UK
        TEXT stripe_customer_id
        TEXT status
        TIMESTAMPTZ current_period_start
        TIMESTAMPTZ current_period_end
        BOOLEAN cancel_at_period_end
        TIMESTAMPTZ canceled_at
        TIMESTAMPTZ trial_start
        TIMESTAMPTZ trial_end
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SUBSCRIPTIONS }o--|| CLIENTS : "references"
    SUBSCRIPTIONS }o--|| SUBSCRIPTION_PLANS : "references"
    INVOICES {
        UUID id PK
        UUID client_id FK
        UUID subscription_id FK
        TEXT stripe_invoice_id UK
        TEXT stripe_payment_intent_id
        INTEGER amount_due
        INTEGER amount_paid
        TEXT currency
        TEXT status
        TEXT description
        TEXT invoice_number
        TEXT invoice_pdf_url
        TEXT hosted_invoice_url
        TIMESTAMPTZ due_date
        TIMESTAMPTZ paid_at
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    INVOICES }o--|| CLIENTS : "references"
    INVOICES }o--|| SUBSCRIPTIONS : "references"
    PAYMENT_LINKS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        TEXT stripe_payment_link_id UK
        TEXT stripe_price_id
        INTEGER amount
        TEXT currency
        TEXT description
        TEXT url
        BOOLEAN is_active
        TIMESTAMPTZ expires_at
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    PAYMENT_LINKS }o--|| AUTH : "references"
    PAYMENT_LINKS }o--|| CLIENTS : "references"
    STRIPE_WEBHOOK_EVENTS {
        UUID id PK
        TEXT stripe_event_id UK
        TEXT event_type
        JSONB event_data
        BOOLEAN processed
        TIMESTAMPTZ processed_at
        TEXT error
        TIMESTAMPTZ created_at
    }

    TRANSACTIONAL_EMAIL_TEMPLATES {
        UUID id PK
        TEXT template_key UK
        TEXT name
        TEXT description
        TEXT subject_template
        TEXT html_content
        TEXT text_content
        JSONB variables
        BOOLEAN is_system_template
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    EMAIL_QUEUE {
        UUID id PK
        TEXT template_key FK
        TEXT to_email
        TEXT to_name
        TEXT from_email
        TEXT subject
        TEXT html_content
        TEXT text_content
        JSONB variables
        TEXT status
        INT priority
        INT attempts
        INT max_attempts
        TIMESTAMPTZ scheduled_at
        TIMESTAMPTZ sent_at
        TIMESTAMPTZ failed_at
        TEXT error_message
        TEXT resend_id
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    EMAIL_QUEUE }o--|| TRANSACTIONAL_EMAIL_TEMPLATES : "references"
    EMAIL_DELIVERY_TRACKING {
        UUID id PK
        UUID email_queue_id FK
        TEXT resend_id
        TEXT event_type
        JSONB event_data
        TIMESTAMPTZ occurred_at
        TIMESTAMPTZ created_at
    }

    EMAIL_DELIVERY_TRACKING }o--|| EMAIL_QUEUE : "references"
    VENDORS {
        UUID id PK
        TEXT name
        TEXT slug UK
        TEXT email UK
        TEXT phone
        TEXT website
        TEXT logo_url
        JSONB brand_colors
        TEXT company_type
        TEXT team_size
        JSONB industry_focus
        TEXT default_timezone
        JSONB notification_settings
        JSONB billing_settings
        TEXT status
        TIMESTAMPTZ onboarded_at
        TIMESTAMPTZ trial_ends_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID created_by FK
        UUID user_id FK
        TEXT handle UK
        TEXT business_name
        TEXT full_name
        TEXT avatar_url
        TEXT bio
        TEXT brand_color
        TEXT timezone
    }

    VENDORS }o--|| AUTH : "references"
    VENDORS }o--|| AUTH : "references"
    VENDOR_TEAM_INVITATIONS {
        UUID id PK
        UUID vendor_id FK
        TEXT email
        TEXT role
        UUID invited_by FK
        TEXT token UK
        TIMESTAMPTZ expires_at
        TEXT status
        TIMESTAMPTZ accepted_at
        UUID accepted_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_TEAM_INVITATIONS }o--|| VENDORS : "references"
    VENDOR_TEAM_INVITATIONS }o--|| AUTH : "references"
    VENDOR_TEAM_INVITATIONS }o--|| AUTH : "references"
    GA4_CONNECTIONS {
        UUID id PK
        UUID vendor_id
        UUID client_id FK
        UUID website_id FK
        TEXT property_id
        TEXT property_name
        TEXT service_account_email
        JSONB service_account_credentials
        TEXT status
        TIMESTAMPTZ last_sync_at
        TEXT last_sync_status
        TEXT last_sync_error
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID created_by
    }

    GA4_CONNECTIONS }o--|| CLIENTS : "references"
    GA4_CONNECTIONS }o--|| WEBSITES : "references"
    VENDOR_SLA_SETTINGS {
        UUID id PK
        UUID vendor_id FK,UK
        INTEGER editor_sla_hours
        INTEGER editor_alert_threshold_hours
        INTEGER client_sla_hours
        INTEGER client_alert_threshold_hours
        BOOLEAN enable_alerts
        JSONB alert_recipients
        BOOLEAN escalation_enabled
        INTEGER escalation_hours
        JSONB escalation_recipients
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_SLA_SETTINGS }o--|| VENDORS : "references"
    REVIEW_SLA_TRACKING {
        UUID id PK
        UUID blog_post_id FK
        UUID vendor_id FK
        UUID client_id FK
        TEXT sla_type
        TIMESTAMPTZ submitted_at
        TIMESTAMPTZ sla_deadline_at
        TIMESTAMPTZ alert_threshold_at
        TIMESTAMPTZ alert_sent_at
        TIMESTAMPTZ escalation_sent_at
        TIMESTAMPTZ completed_at
        TEXT status
        NUMERIC(10, 2) review_duration_hours
        BOOLEAN breached
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    REVIEW_SLA_TRACKING }o--|| BLOG_POSTS : "references"
    REVIEW_SLA_TRACKING }o--|| VENDORS : "references"
    REVIEW_SLA_TRACKING }o--|| CLIENTS : "references"
    WORK_DECLARATIONS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID content_batch_id FK
        UUID created_by FK
        TEXT title
        TEXT description
        TEXT type
        TEXT status
        TEXT priority
        DATE start_date
        DATE due_date
        TIMESTAMPTZ completed_at
        INTEGER progress_percentage
        JSONB milestones
        JSONB deliverables
        JSONB metadata
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    WORK_DECLARATIONS }o--|| VENDORS : "references"
    WORK_DECLARATIONS }o--|| CLIENTS : "references"
    WORK_DECLARATIONS }o--|| CONTENT_BATCHES : "references"
    WORK_DECLARATIONS }o--|| AUTH : "references"
    WORK_DECLARATION_UPDATES {
        UUID id PK
        UUID work_declaration_id FK
        UUID created_by FK
        TEXT update_type
        TEXT old_value
        TEXT new_value
        TEXT comment
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    WORK_DECLARATION_UPDATES }o--|| WORK_DECLARATIONS : "references"
    WORK_DECLARATION_UPDATES }o--|| AUTH : "references"
    FILE_FOLDERS {
        UUID id PK
        TEXT name
        UUID parent_folder_id FK
        UUID client_id FK
        UUID vendor_id FK
        TEXT description
        TEXT color
        TEXT icon
        BOOLEAN is_system
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    FILE_FOLDERS }o--|| FILE_FOLDERS : "references"
    FILE_FOLDERS }o--|| CLIENTS : "references"
    FILE_FOLDERS }o--|| VENDORS : "references"
    FILE_FOLDERS }o--|| AUTH : "references"
    FILES {
        UUID id PK
        TEXT filename
        TEXT original_filename
        TEXT file_type
        TEXT file_extension
        BIGINT file_size
        TEXT storage_path UK
        TEXT storage_bucket
        UUID folder_id FK
        UUID client_id FK
        UUID vendor_id FK
        TEXT title
        TEXT description
        TEXT tags
        JSONB metadata
        TEXT status
        BOOLEAN is_public
        UUID related_post_id FK
        UUID related_batch_id FK
        UUID related_work_id FK
        UUID uploaded_by FK
        TIMESTAMPTZ uploaded_at
        BOOLEAN is_processed
        TEXT processing_status
        TEXT processing_error
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ last_accessed_at
    }

    FILES }o--|| FILE_FOLDERS : "references"
    FILES }o--|| CLIENTS : "references"
    FILES }o--|| VENDORS : "references"
    FILES }o--|| BLOG_POSTS : "references"
    FILES }o--|| CONTENT_BATCHES : "references"
    FILES }o--|| WORK_DECLARATIONS : "references"
    FILES }o--|| AUTH : "references"
    FILE_SHARES {
        UUID id PK
        UUID file_id FK
        TEXT share_token UK
        TEXT permission
        TIMESTAMPTZ expires_at
        BOOLEAN is_password_protected
        TEXT password_hash
        INTEGER max_downloads
        INTEGER download_count
        INTEGER view_count
        TIMESTAMPTZ last_accessed_at
        UUID shared_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ revoked_at
        IS revoked_at
    }

    FILE_SHARES }o--|| FILES : "references"
    FILE_SHARES }o--|| AUTH : "references"
    FILE_ACCESS_LOGS {
        UUID id PK
        UUID file_id FK
        UUID user_id FK
        UUID share_id FK
        TEXT action
        TEXT ip_address
        TEXT user_agent
        TIMESTAMPTZ accessed_at
    }

    FILE_ACCESS_LOGS }o--|| FILES : "references"
    FILE_ACCESS_LOGS }o--|| AUTH : "references"
    FILE_ACCESS_LOGS }o--|| FILE_SHARES : "references"
    FILE_VERSIONS {
        UUID id PK
        UUID file_id FK
        INTEGER version_number
        TEXT storage_path
        TEXT storage_bucket
        TEXT filename
        TEXT file_type
        BIGINT file_size
        TEXT title
        TEXT description
        TEXT tags
        JSONB metadata
        TEXT change_summary
        BOOLEAN is_current
        UUID uploaded_by FK
        TIMESTAMPTZ uploaded_at
    }

    FILE_VERSIONS }o--|| FILES : "references"
    FILE_VERSIONS }o--|| AUTH : "references"
    API_KEYS {
        UUID id PK
        UUID vendor_id FK
        VARCHAR(255) name
        VARCHAR(10) key_prefix
        VARCHAR(255) key_hash
        JSONB scopes
        BOOLEAN is_active
        TIMESTAMPTZ last_used_at
        TIMESTAMPTZ expires_at
        INTEGER rate_limit_per_minute
        INTEGER rate_limit_per_hour
        INTEGER rate_limit_per_day
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID created_by FK
    }

    API_KEYS }o--|| VENDORS : "references"
    API_KEYS }o--|| AUTH : "references"
    API_KEY_USAGE {
        UUID id PK
        UUID api_key_id FK
        VARCHAR(255) endpoint
        VARCHAR(10) method
        INTEGER status_code
        INTEGER response_time_ms
        INET ip_address
        TEXT user_agent
        TIMESTAMPTZ created_at
    }

    API_KEY_USAGE }o--|| API_KEYS : "references"
    API_KEY_RATE_LIMIT_BUCKETS {
        UUID id PK
        UUID api_key_id FK
        VARCHAR(20) window_type
        TIMESTAMPTZ window_start
        INTEGER request_count
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    API_KEY_RATE_LIMIT_BUCKETS }o--|| API_KEYS : "references"
    WEBHOOKS {
        UUID id PK
        UUID vendor_id FK
        VARCHAR(255) name
        TEXT url
        TEXT events
        TEXT secret
        BOOLEAN is_active
        INTEGER retry_count
        INTEGER retry_delay_seconds
        INTEGER timeout_seconds
        JSONB headers
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID created_by FK
        TIMESTAMPTZ last_triggered_at
    }

    WEBHOOKS }o--|| VENDORS : "references"
    WEBHOOKS }o--|| AUTH : "references"
    WEBHOOK_DELIVERIES {
        UUID id PK
        UUID webhook_id FK
        VARCHAR(100) event
        JSONB payload
        INTEGER response_status
        TEXT response_body
        JSONB response_headers
        TEXT error_message
        TIMESTAMPTZ delivered_at
        INTEGER attempts
        TIMESTAMPTZ next_retry_at
        TIMESTAMPTZ completed_at
        VARCHAR(20) status
        TIMESTAMPTZ created_at
    }

    WEBHOOK_DELIVERIES }o--|| WEBHOOKS : "references"
    WEBHOOK_EVENTS_LOG {
        UUID id PK
        UUID vendor_id FK
        VARCHAR(100) event
        JSONB payload
        INTEGER webhook_count
        TIMESTAMPTZ created_at
    }

    WEBHOOK_EVENTS_LOG }o--|| VENDORS : "references"
    COMMENT_MENTIONS {
        uuid id PK
        uuid comment_id FK
        uuid mentioned_user_id FK
        boolean notification_sent
        timestamptz created_at
    }

    COMMENT_MENTIONS }o--|| COMMENTS : "references"
    COMMENT_MENTIONS }o--|| AUTH : "references"
    PUBLISH_QUEUE {
        UUID id PK
        UUID blog_post_id FK
        UUID content_batch_id FK
        UUID client_id FK
        UUID cms_connection_id FK
        TEXT website_url
        TEXT publish_status
        TIMESTAMPTZ scheduled_for
        INT priority
        TEXT status
        INT attempts
        INT max_attempts
        TIMESTAMPTZ last_attempt_at
        TIMESTAMPTZ next_retry_at
        TEXT wordpress_post_id
        TEXT published_url
        TEXT error_message
        JSONB error_details
        UUID queued_by FK
        TIMESTAMPTZ queued_at
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        JSONB options
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    PUBLISH_QUEUE }o--|| BLOG_POSTS : "references"
    PUBLISH_QUEUE }o--|| CONTENT_BATCHES : "references"
    PUBLISH_QUEUE }o--|| CLIENTS : "references"
    PUBLISH_QUEUE }o--|| CMS_CONNECTIONS : "references"
    PUBLISH_QUEUE }o--|| AUTH : "references"
    COMPETITORS {
        UUID id PK
        UUID website_id FK
        TEXT competitor_url
        TEXT competitor_domain
        TEXT name
        TEXT notes
        TEXT status
        TIMESTAMPTZ last_analyzed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    COMPETITORS }o--|| WEBSITES : "references"
    COMPETITOR_AUDITS {
        UUID id PK
        UUID competitor_id FK
        INTEGER seo_score
        INTEGER pages_indexed
        TIMESTAMPTZ audit_date
        JSONB raw_metrics
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    COMPETITOR_AUDITS }o--|| COMPETITORS : "references"
    COMPETITOR_KEYWORDS {
        UUID id PK
        UUID competitor_id FK
        TEXT keyword
        INTEGER search_volume
        INTEGER difficulty
        INTEGER ranking_position
        TEXT ranking_url
        TEXT search_intent
        BOOLEAN we_rank
        INTEGER our_position
        INTEGER gap_priority
        TIMESTAMPTZ discovered_at
        TIMESTAMPTZ last_checked_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    COMPETITOR_KEYWORDS }o--|| COMPETITORS : "references"
    GMAIL_CONNECTIONS {
        UUID id PK
        UUID user_id FK
        UUID vendor_id FK
        TEXT gmail_address
        TEXT access_token_encrypted
        TEXT refresh_token_encrypted
        TIMESTAMPTZ token_expires_at
        BOOLEAN sync_enabled
        TIMESTAMPTZ last_sync_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    GMAIL_CONNECTIONS }o--|| AUTH : "references"
    GMAIL_CONNECTIONS }o--|| VENDORS : "references"
    EMAIL_THREADS {
        UUID id PK
        UUID gmail_connection_id FK
        UUID client_id FK
        UUID project_id FK
        TEXT gmail_thread_id
        TEXT subject
        TEXT snippet
        TIMESTAMPTZ last_message_at
        INT message_count
        BOOLEAN is_read
        TEXT labels
        TEXT participants
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    EMAIL_THREADS }o--|| GMAIL_CONNECTIONS : "references"
    EMAIL_THREADS }o--|| CLIENTS : "references"
    EMAIL_THREADS }o--|| CONTENT_BATCHES : "references"
    EMAIL_MESSAGES {
        UUID id PK
        UUID email_thread_id FK
        TEXT gmail_message_id
        TEXT from_address
        TEXT to_addresses
        TEXT cc_addresses
        TEXT bcc_addresses
        TEXT subject
        TEXT body_text
        TEXT body_html
        TIMESTAMPTZ sent_at
        BOOLEAN is_draft
        TIMESTAMPTZ created_at
    }

    EMAIL_MESSAGES }o--|| EMAIL_THREADS : "references"
    EMAIL_ATTACHMENTS {
        UUID id PK
        UUID email_message_id FK
        TEXT gmail_attachment_id
        TEXT filename
        TEXT mime_type
        INT size_bytes
        TEXT storage_path
        TIMESTAMPTZ created_at
    }

    EMAIL_ATTACHMENTS }o--|| EMAIL_MESSAGES : "references"
    BLOG_POST_GENERATED_IMAGES {
        uuid id PK
        uuid blog_post_id FK
        text prompt
        text revised_prompt
        text image_url
        text storage_path
        text model
        text size
        text quality
        text style
        boolean is_selected
        boolean is_featured
        text generation_status
        timestamptz created_at
        timestamptz updated_at
    }

    BLOG_POST_GENERATED_IMAGES }o--|| BLOG_POSTS : "references"
    OUTLINE_OPTIONS {
        UUID id PK
        UUID blog_post_id FK
        INTEGER option_number
        JSONB outline_data
        INTEGER total_estimated_words
        TIMESTAMPTZ generated_at
        BOOLEAN is_selected
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    OUTLINE_OPTIONS }o--|| BLOG_POSTS : "references"
    WORDPRESS_CONNECTIONS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        TEXT site_url
        TEXT site_name
        TEXT username
        TEXT application_password_encrypted
        BOOLEAN is_active
        TIMESTAMPTZ last_connected_at
        TEXT connection_status
        TEXT connection_error
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID created_by FK
    }

    WORDPRESS_CONNECTIONS }o--|| VENDORS : "references"
    WORDPRESS_CONNECTIONS }o--|| CLIENTS : "references"
    WORDPRESS_CONNECTIONS }o--|| AUTH : "references"
    WORDPRESS_PUBLISH_LOG {
        UUID id PK
        UUID blog_post_id FK
        UUID wordpress_connection_id FK
        INTEGER wp_post_id
        TEXT wp_post_url
        TEXT wp_post_status
        TIMESTAMPTZ published_at
        TIMESTAMPTZ scheduled_for
        TEXT status
        TEXT error_message
        INTEGER retry_count
        TEXT content_hash
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    WORDPRESS_PUBLISH_LOG }o--|| BLOG_POSTS : "references"
    WORDPRESS_PUBLISH_LOG }o--|| WORDPRESS_CONNECTIONS : "references"
    SCHEDULED_REPORTS {
        UUID id PK
        UUID vendor_id FK
        TEXT name
        TEXT description
        UUID website_id FK
        UUID content_batch_id FK
        TEXT report_type
        TEXT frequency
        INTEGER day_of_week
        INTEGER day_of_month
        INTEGER quarter_month
        INTEGER period_length
        TEXT period_unit
        TEXT recipient_emails
        BOOLEAN include_pdf_attachment
        BOOLEAN is_active
        TIMESTAMPTZ last_run_at
        TIMESTAMPTZ next_run_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SCHEDULED_REPORTS }o--|| AUTH : "references"
    SCHEDULED_REPORTS }o--|| WEBSITES : "references"
    SCHEDULED_REPORTS }o--|| CONTENT_BATCHES : "references"
    SCHEDULED_REPORT_EXECUTIONS {
        UUID id PK
        UUID scheduled_report_id FK
        UUID report_id FK
        TEXT execution_status
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TEXT error_message
        TIMESTAMPTZ period_start
        TIMESTAMPTZ period_end
        TEXT emails_sent_to
        TIMESTAMPTZ email_sent_at
        TEXT email_error
        TIMESTAMPTZ created_at
    }

    SCHEDULED_REPORT_EXECUTIONS }o--|| SCHEDULED_REPORTS : "references"
    SCHEDULED_REPORT_EXECUTIONS }o--|| REPORTS : "references"
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        UUID vendor_id FK
        UUID client_id FK
        UUID api_key_id FK
        TEXT action_type
        TEXT resource_type
        UUID resource_id
        TEXT endpoint
        TEXT method
        INTEGER status_code
        JSONB changes
        jsonb metadata
        inet ip_address
        text user_agent
        TEXT session_id
        INTEGER duration_ms
        BOOLEAN success
        TEXT error_message
        timestamp created_at
        text table_name
        uuid record_id
        text action
        text user_email
        jsonb old_values
        jsonb new_values
        text changed_fields
    }

    AUDIT_LOGS }o--|| AUTH : "references"
    AUDIT_LOGS }o--|| VENDORS : "references"
    AUDIT_LOGS }o--|| CLIENTS : "references"
    AUDIT_LOGS }o--|| API_KEYS : "references"
    AUDIT_LOG_EXPORTS {
        UUID id PK
        UUID user_id FK
        UUID vendor_id FK
        TEXT export_type
        JSONB filters
        INTEGER record_count
        BIGINT file_size_bytes
        TEXT file_path
        TEXT status
        TEXT error_message
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
    }

    AUDIT_LOG_EXPORTS }o--|| AUTH : "references"
    AUDIT_LOG_EXPORTS }o--|| VENDORS : "references"
    GENERATED_IMAGES {
        uuid id PK
        uuid blog_post_id FK
        text prompt
        text model
        text size
        text quality
        text style
        text storage_path
        text storage_bucket
        text url
        bigint file_size
        text mime_type
        int width
        int height
        boolean is_selected
        boolean is_featured
        text position
        text alt_text
        text caption
        text revised_prompt
        jsonb generation_metadata
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    GENERATED_IMAGES }o--|| BLOG_POSTS : "references"
    USER_2FA_SETTINGS {
        UUID id PK
        UUID user_id FK,UK
        BOOLEAN enabled
        BOOLEAN enforced
        TEXT totp_secret
        BOOLEAN totp_verified
        TIMESTAMPTZ backup_codes_generated_at
        INTEGER backup_codes_count
        TIMESTAMPTZ enabled_at
        TIMESTAMPTZ last_used_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    USER_2FA_SETTINGS }o--|| AUTH : "references"
    USER_2FA_BACKUP_CODES {
        UUID id PK
        UUID user_id FK
        TEXT code_hash
        BOOLEAN used
        TIMESTAMPTZ used_at
        TIMESTAMPTZ created_at
    }

    USER_2FA_BACKUP_CODES }o--|| AUTH : "references"
    USER_2FA_AUDIT_LOG {
        UUID id PK
        UUID user_id FK
        TEXT event_type
        TEXT ip_address
        TEXT user_agent
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    USER_2FA_AUDIT_LOG }o--|| AUTH : "references"
    PIPELINE_JOBS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        TEXT website_url
        TEXT target_market
        TEXT client_goals
        TEXT ideal_customer_profile
        TEXT status
        TEXT current_step
        INTEGER progress
        JSONB crawl_result
        JSONB analyze_result
        JSONB gaps_result
        JSONB topics_result
        INTEGER seo_score
        INTEGER pages_indexed
        INTEGER content_gaps
        INTEGER topics_generated
        INTEGER blogs_created
        TEXT error_message
        TEXT error_step
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    PIPELINE_JOBS }o--|| VENDORS : "references"
    PIPELINE_JOBS }o--|| CLIENTS : "references"
    CONTENT_APPROVALS {
        UUID id PK
        UUID blog_post_id FK
        UUID batch_id FK
        TEXT action
        UUID actor_id FK
        TEXT actor_type
        TEXT comment
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    CONTENT_APPROVALS }o--|| BLOG_POSTS : "references"
    CONTENT_APPROVALS }o--|| CONTENT_BATCHES : "references"
    CONTENT_APPROVALS }o--|| PROFILES : "references"
    REVISION_REQUESTS {
        UUID id PK
        UUID blog_post_id FK
        UUID batch_id FK
        UUID requested_by FK
        TEXT comment
        JSONB specific_changes
        TEXT status
        TIMESTAMPTZ addressed_at
        UUID addressed_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    REVISION_REQUESTS }o--|| BLOG_POSTS : "references"
    REVISION_REQUESTS }o--|| CONTENT_BATCHES : "references"
    REVISION_REQUESTS }o--|| PROFILES : "references"
    REVISION_REQUESTS }o--|| PROFILES : "references"
    NOTIFICATIONS {
        UUID id PK
        UUID user_id FK
        TEXT type
        TEXT title
        TEXT message
        TEXT link
        BOOLEAN read
        TIMESTAMPTZ read_at
        BOOLEAN email_sent
        TIMESTAMPTZ email_sent_at
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    NOTIFICATIONS }o--|| PROFILES : "references"
    WORDPRESS_SITES {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID website_id FK
        TEXT name
        TEXT site_url
        TEXT api_url
        TEXT api_username
        TEXT api_key_encrypted
        TEXT status
        TIMESTAMPTZ last_publish_at
        TEXT last_error
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    WORDPRESS_SITES }o--|| VENDORS : "references"
    WORDPRESS_SITES }o--|| CLIENTS : "references"
    WORDPRESS_SITES }o--|| WEBSITES : "references"
    WORDPRESS_POSTS {
        UUID id PK
        UUID blog_post_id FK
        UUID wordpress_site_id FK
        INTEGER wordpress_post_id
        TEXT wordpress_url
        TEXT wordpress_status
        TIMESTAMPTZ published_at
        TIMESTAMPTZ last_synced_at
        JSONB metadata
    }

    WORDPRESS_POSTS }o--|| BLOG_POSTS : "references"
    WORDPRESS_POSTS }o--|| WORDPRESS_SITES : "references"
    CONTENT_REQUESTS {
        UUID id PK
        UUID client_id FK
        UUID vendor_id FK
        UUID requested_by FK
        VARCHAR(50) content_type
        VARCHAR(255) title
        TEXT message
        VARCHAR(20) priority
        VARCHAR(50) status
        TEXT vendor_response
        TIMESTAMPTZ responded_at
        UUID responded_by FK
        UUID result_blog_post_id FK
        UUID result_batch_id FK
        JSONB attachments
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CONTENT_REQUESTS }o--|| CLIENTS : "references"
    CONTENT_REQUESTS }o--|| VENDORS : "references"
    CONTENT_REQUESTS }o--|| PROFILES : "references"
    CONTENT_REQUESTS }o--|| PROFILES : "references"
    CONTENT_REQUESTS }o--|| BLOG_POSTS : "references"
    CONTENT_REQUESTS }o--|| CONTENT_BATCHES : "references"
    BLOG_POST_CHANGE_REQUESTS {
        UUID id PK
        UUID blog_post_id FK
        UUID requested_by
        TIMESTAMPTZ requested_at
        TEXT feedback
        TEXT status
        TIMESTAMPTZ resolved_at
        UUID resolved_by
        TEXT resolution_notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    BLOG_POST_CHANGE_REQUESTS }o--|| BLOG_POSTS : "references"
    WORDPRESS_TAXONOMY_CACHE {
        UUID id PK
        UUID wordpress_connection_id
        TEXT taxonomy_type
        INTEGER taxonomy_id
        TEXT name
        TEXT slug
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CHECK_BACK_CONFIGURATIONS {
        UUID id PK
        UUID website_id FK
        JSONB intervals
        BOOLEAN enabled
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CHECK_BACK_CONFIGURATIONS }o--|| WEBSITES : "references"
    AGENT_OUTPUTS {
        UUID id PK
        UUID blog_post_id FK
        TEXT agent_name
        TEXT agent_version
        JSONB input
        JSONB output
        INTEGER duration_ms
        TEXT model_used
        INTEGER token_count
        TEXT status
        TEXT error_message
        TIMESTAMPTZ created_at
        IN agent_name
        IN status
    }

    AGENT_OUTPUTS }o--|| BLOG_POSTS : "references"
    SCHEDULED_PIPELINE_RUNS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        TEXT name
        TEXT website_url
        TEXT target_market
        TEXT client_goals
        TEXT ideal_customer_profile
        TEXT frequency
        INTEGER day_of_week
        INTEGER day_of_month
        TIME time_of_day
        BOOLEAN is_active
        TIMESTAMPTZ last_run_at
        TIMESTAMPTZ next_run_at
        UUID last_job_id FK
        INTEGER total_runs
        INTEGER successful_runs
        INTEGER failed_runs
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SCHEDULED_PIPELINE_RUNS }o--|| VENDORS : "references"
    SCHEDULED_PIPELINE_RUNS }o--|| CLIENTS : "references"
    SCHEDULED_PIPELINE_RUNS }o--|| PIPELINE_JOBS : "references"
    WEBSITE_SCANS {
        UUID id PK
        UUID website_id FK
        VARCHAR(50) scan_type
        VARCHAR(50) status
        TEXT url
        INTEGER max_pages
        INTEGER max_depth
        INTEGER pages_scanned
        JSONB text_content
        JSONB schema_markup
        JSONB images
        JSONB site_metadata
        JSONB internal_links
        JSONB external_links
        JSONB content_analysis
        JSONB seo_elements
        JSONB errors
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    WEBSITE_SCANS }o--|| WEBSITES : "references"
    VENDOR_MEMBERS {
        UUID id PK
        UUID vendor_id FK
        UUID user_id FK
        TEXT role
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_MEMBERS }o--|| VENDORS : "references"
    VENDOR_MEMBERS }o--|| AUTH : "references"
    OFFER_PAGES {
        UUID id PK
        UUID vendor_id FK
        TEXT title
        TEXT slug
        TEXT description
        JSONB blocks
        TEXT meta_title
        TEXT meta_description
        TEXT og_image_url
        BOOLEAN is_published
        TIMESTAMPTZ published_at
        INTEGER view_count
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    OFFER_PAGES }o--|| VENDORS : "references"
    OFFERS {
        UUID id PK
        UUID page_id FK
        UUID vendor_id FK
        TEXT name
        TEXT description
        TEXT offer_type
        DECIMAL(10, 2) base_price
        TEXT currency
        TEXT billing_period
        BOOLEAN is_quote_mode
        TEXT stripe_product_id
        TEXT stripe_price_id
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    OFFERS }o--|| OFFER_PAGES : "references"
    OFFERS }o--|| VENDORS : "references"
    OFFER_ADDONS {
        UUID id PK
        UUID offer_id FK
        UUID vendor_id FK
        TEXT name
        TEXT description
        TEXT addon_type
        DECIMAL(10, 2) price
        TEXT currency
        TEXT stripe_product_id
        TEXT stripe_price_id
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    OFFER_ADDONS }o--|| OFFERS : "references"
    OFFER_ADDONS }o--|| VENDORS : "references"
    VENDOR_CLIENTS {
        UUID id PK
        UUID vendor_id FK
        UUID user_id FK
        TEXT email
        TEXT full_name
        TEXT phone
        UUID first_page_id FK
        TEXT utm_source
        TEXT utm_medium
        TEXT utm_campaign
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_CLIENTS }o--|| VENDORS : "references"
    VENDOR_CLIENTS }o--|| AUTH : "references"
    VENDOR_CLIENTS }o--|| OFFER_PAGES : "references"
    VENDOR_WORKSPACES {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID offer_id FK
        UUID page_id FK
        TEXT name
        TEXT status
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_WORKSPACES }o--|| VENDORS : "references"
    VENDOR_WORKSPACES }o--|| VENDOR_CLIENTS : "references"
    VENDOR_WORKSPACES }o--|| OFFERS : "references"
    VENDOR_WORKSPACES }o--|| OFFER_PAGES : "references"
    VENDOR_ORDERS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID workspace_id FK
        UUID offer_id FK
        TEXT order_number UK
        DECIMAL(10, 2) base_amount
        DECIMAL(10, 2) addons_amount
        DECIMAL(10, 2) total_amount
        TEXT currency
        TEXT payment_method
        TEXT payment_status
        TEXT stripe_checkout_session_id
        TEXT stripe_payment_intent_id
        TEXT stripe_customer_id
        JSONB metadata
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_ORDERS }o--|| VENDORS : "references"
    VENDOR_ORDERS }o--|| VENDOR_CLIENTS : "references"
    VENDOR_ORDERS }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_ORDERS }o--|| OFFERS : "references"
    VENDOR_ORDER_ITEMS {
        UUID id PK
        UUID order_id FK
        TEXT item_type
        UUID offer_id FK
        UUID addon_id FK
        TEXT name
        TEXT description
        DECIMAL(10, 2) unit_price
        INTEGER quantity
        DECIMAL(10, 2) total_price
        TIMESTAMPTZ created_at
    }

    VENDOR_ORDER_ITEMS }o--|| VENDOR_ORDERS : "references"
    VENDOR_ORDER_ITEMS }o--|| OFFERS : "references"
    VENDOR_ORDER_ITEMS }o--|| OFFER_ADDONS : "references"
    VENDOR_SUBSCRIPTIONS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID workspace_id FK
        UUID offer_id FK
        TEXT status
        DECIMAL(10, 2) amount
        TEXT currency
        TEXT billing_period
        TEXT stripe_subscription_id UK
        TEXT stripe_customer_id
        TIMESTAMPTZ current_period_start
        TIMESTAMPTZ current_period_end
        TIMESTAMPTZ cancel_at
        TIMESTAMPTZ cancelled_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_SUBSCRIPTIONS }o--|| VENDORS : "references"
    VENDOR_SUBSCRIPTIONS }o--|| VENDOR_CLIENTS : "references"
    VENDOR_SUBSCRIPTIONS }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_SUBSCRIPTIONS }o--|| OFFERS : "references"
    ONBOARDING_STEPS {
        UUID id PK
        UUID workspace_id FK
        UUID vendor_id FK
        TEXT title
        TEXT description
        INTEGER step_order
        BOOLEAN is_completed
        TIMESTAMPTZ completed_at
        UUID completed_by FK
        BOOLEAN requires_file_upload
        BOOLEAN requires_form_submission
        UUID linked_form_id
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ONBOARDING_STEPS }o--|| VENDOR_WORKSPACES : "references"
    ONBOARDING_STEPS }o--|| VENDORS : "references"
    ONBOARDING_STEPS }o--|| AUTH : "references"
    VENDOR_FORMS {
        UUID id PK
        UUID vendor_id FK
        TEXT name
        TEXT description
        JSONB fields
        BOOLEAN is_template
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_FORMS }o--|| VENDORS : "references"
    VENDOR_FORM_SUBMISSIONS {
        UUID id PK
        UUID form_id FK
        UUID workspace_id FK
        UUID vendor_id FK
        UUID client_id FK
        JSONB responses
        BOOLEAN is_reviewed
        TIMESTAMPTZ reviewed_at
        UUID reviewed_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_FORM_SUBMISSIONS }o--|| VENDOR_FORMS : "references"
    VENDOR_FORM_SUBMISSIONS }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_FORM_SUBMISSIONS }o--|| VENDORS : "references"
    VENDOR_FORM_SUBMISSIONS }o--|| VENDOR_CLIENTS : "references"
    VENDOR_FORM_SUBMISSIONS }o--|| AUTH : "references"
    VENDOR_MESSAGES {
        UUID id PK
        UUID workspace_id FK
        UUID vendor_id FK
        UUID sender_id FK
        TEXT sender_type
        TEXT content
        JSONB attachments
        BOOLEAN is_read
        TIMESTAMPTZ read_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_MESSAGES }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_MESSAGES }o--|| VENDORS : "references"
    VENDOR_MESSAGES }o--|| AUTH : "references"
    VENDOR_DELIVERABLES {
        UUID id PK
        UUID workspace_id FK
        UUID vendor_id FK
        TEXT name
        TEXT description
        TEXT deliverable_type
        TEXT file_url
        BIGINT file_size
        TEXT file_type
        TEXT status
        TIMESTAMPTZ delivered_at
        TIMESTAMPTZ approved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_DELIVERABLES }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_DELIVERABLES }o--|| VENDORS : "references"
    VENDOR_REVISIONS {
        UUID id PK
        UUID workspace_id FK
        UUID vendor_id FK
        UUID deliverable_id FK
        TEXT title
        TEXT description
        UUID requested_by FK
        TEXT status
        TEXT resolution_notes
        UUID resolved_by FK
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_REVISIONS }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_REVISIONS }o--|| VENDORS : "references"
    VENDOR_REVISIONS }o--|| VENDOR_DELIVERABLES : "references"
    VENDOR_REVISIONS }o--|| AUTH : "references"
    VENDOR_REVISIONS }o--|| AUTH : "references"
    VENDOR_MEETING_TYPES {
        UUID id PK
        UUID vendor_id FK
        TEXT name
        TEXT description
        INTEGER duration_minutes
        INTEGER buffer_before_minutes
        INTEGER buffer_after_minutes
        TEXT location_type
        TEXT location_details
        BOOLEAN is_paid
        DECIMAL(10, 2) price
        TEXT currency
        BOOLEAN is_active
        TEXT color
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_MEETING_TYPES }o--|| VENDORS : "references"
    VENDOR_MEETINGS {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID workspace_id FK
        UUID meeting_type_id FK
        TEXT title
        TEXT description
        TIMESTAMPTZ start_time
        TIMESTAMPTZ end_time
        TEXT timezone
        TEXT location_type
        TEXT location_details
        TEXT meeting_link
        UUID vendor_user_id FK
        UUID client_user_id FK
        TEXT client_email
        TEXT client_name
        TEXT status
        TEXT google_calendar_event_id
        TEXT notes
        TIMESTAMPTZ cancelled_at
        TEXT cancellation_reason
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_MEETINGS }o--|| VENDORS : "references"
    VENDOR_MEETINGS }o--|| VENDOR_CLIENTS : "references"
    VENDOR_MEETINGS }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_MEETINGS }o--|| VENDOR_MEETING_TYPES : "references"
    VENDOR_MEETINGS }o--|| AUTH : "references"
    VENDOR_MEETINGS }o--|| AUTH : "references"
    VENDOR_AVAILABILITY {
        UUID id PK
        UUID vendor_id FK
        INTEGER day_of_week
        TIME start_time
        TIME end_time
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_AVAILABILITY }o--|| VENDORS : "references"
    VENDOR_CALENDAR_INTEGRATIONS {
        UUID id PK
        UUID vendor_id FK
        TEXT provider
        TEXT access_token
        TEXT refresh_token
        TIMESTAMPTZ token_expires_at
        TEXT calendar_id
        TEXT calendar_name
        BOOLEAN is_active
        TIMESTAMPTZ last_sync_at
        TEXT sync_error
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_CALENDAR_INTEGRATIONS }o--|| VENDORS : "references"
    VENDOR_EVENT_LOG {
        UUID id PK
        TEXT event_name
        TEXT event_type
        UUID vendor_id FK
        UUID page_id FK
        UUID client_id FK
        UUID workspace_id FK
        TEXT session_id
        UUID user_id FK
        TEXT user_type
        JSONB properties
        TEXT utm_source
        TEXT utm_medium
        TEXT utm_campaign
        TEXT utm_content
        TEXT utm_term
        TEXT referrer
        TEXT user_agent
        INET ip_address
        TEXT device_type
        TEXT browser
        TEXT os
        TEXT country
        TEXT city
        TIMESTAMPTZ created_at
    }

    VENDOR_EVENT_LOG }o--|| VENDORS : "references"
    VENDOR_EVENT_LOG }o--|| OFFER_PAGES : "references"
    VENDOR_EVENT_LOG }o--|| VENDOR_CLIENTS : "references"
    VENDOR_EVENT_LOG }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_EVENT_LOG }o--|| AUTH : "references"
    VENDOR_ATTRIBUTION {
        UUID id PK
        TEXT session_id UK
        UUID vendor_id FK
        UUID first_page_id FK
        TEXT first_utm_source
        TEXT first_utm_medium
        TEXT first_utm_campaign
        TEXT first_utm_content
        TEXT first_utm_term
        TEXT first_referrer
        UUID last_page_id FK
        TEXT last_utm_source
        TEXT last_utm_medium
        TEXT last_utm_campaign
        TEXT last_utm_content
        TEXT last_utm_term
        TEXT last_referrer
        BOOLEAN converted
        TIMESTAMPTZ converted_at
        UUID client_id FK
        UUID order_id FK
        TIMESTAMPTZ first_visit_at
        TIMESTAMPTZ last_visit_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_ATTRIBUTION }o--|| VENDORS : "references"
    VENDOR_ATTRIBUTION }o--|| OFFER_PAGES : "references"
    VENDOR_ATTRIBUTION }o--|| OFFER_PAGES : "references"
    VENDOR_ATTRIBUTION }o--|| VENDOR_CLIENTS : "references"
    VENDOR_ATTRIBUTION }o--|| VENDOR_ORDERS : "references"
    VENDOR_DAILY_ROLLUPS {
        UUID id PK
        UUID vendor_id FK
        DATE date
        INTEGER page_views
        INTEGER avg_time_on_page
        INTEGER avg_scroll_depth
        INTEGER cta_clicks
        DECIMAL(5, 2) cta_click_rate
        INTEGER call_bookings
        DECIMAL(10, 2) revenue
        TEXT currency
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_DAILY_ROLLUPS }o--|| VENDORS : "references"
    VENDOR_PAGE_DAILY_ROLLUPS {
        UUID id PK
        UUID vendor_id FK
        UUID page_id FK
        DATE date
        INTEGER page_views
        INTEGER avg_time_on_page
        INTEGER avg_scroll_depth
        INTEGER vsl_plays
        DECIMAL(5, 2) vsl_completion_rate
        INTEGER cta_clicks
        DECIMAL(5, 2) cta_click_rate
        INTEGER call_bookings
        DECIMAL(10, 2) revenue
        TEXT currency
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_PAGE_DAILY_ROLLUPS }o--|| VENDORS : "references"
    VENDOR_PAGE_DAILY_ROLLUPS }o--|| OFFER_PAGES : "references"
    VENDOR_CLIENT_ENGAGEMENT {
        UUID id PK
        UUID vendor_id FK
        UUID client_id FK
        UUID workspace_id FK
        DATE week_start
        INTEGER portal_visits
        INTEGER messages_sent
        INTEGER forms_submitted
        INTEGER deliverables_viewed
        INTEGER engagement_score
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_CLIENT_ENGAGEMENT }o--|| VENDORS : "references"
    VENDOR_CLIENT_ENGAGEMENT }o--|| VENDOR_CLIENTS : "references"
    VENDOR_CLIENT_ENGAGEMENT }o--|| VENDOR_WORKSPACES : "references"
    VENDOR_FUNNEL_STATS {
        UUID id PK
        UUID vendor_id FK
        UUID page_id FK
        TEXT session_id
        BOOLEAN viewed_page
        BOOLEAN scrolled_50
        BOOLEAN played_vsl
        BOOLEAN clicked_cta
        BOOLEAN started_checkout
        BOOLEAN completed_checkout
        TIMESTAMPTZ viewed_page_at
        TIMESTAMPTZ scrolled_50_at
        TIMESTAMPTZ played_vsl_at
        TIMESTAMPTZ clicked_cta_at
        TIMESTAMPTZ started_checkout_at
        TIMESTAMPTZ completed_checkout_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    VENDOR_FUNNEL_STATS }o--|| VENDORS : "references"
    VENDOR_FUNNEL_STATS }o--|| OFFER_PAGES : "references"
    PUSH_SUBSCRIPTIONS {
        UUID id PK
        UUID user_id FK
        TEXT endpoint
        TEXT p256dh_key
        TEXT auth_key
        JSONB device_info
        TIMESTAMPTZ created_at
        TIMESTAMPTZ last_used_at
    }

    PUSH_SUBSCRIPTIONS }o--|| AUTH : "references"
    NOTIFICATION_PREFERENCES {
        uuid id PK
        uuid user_id FK
        TEXT channel
        TEXT event_type
        BOOLEAN enabled
        timestamp created_at
        timestamp updated_at
        boolean email_new_order
        boolean email_order_update
        boolean email_message
        boolean email_content_approved
        boolean email_content_rejected
        boolean email_meeting_reminder
        boolean email_weekly_summary
        boolean in_app_new_order
        boolean in_app_message
        boolean in_app_content_update
    }

    NOTIFICATION_PREFERENCES }o--|| AUTH : "references"
    NOTIFICATION_LOG {
        UUID id PK
        UUID user_id FK
        TEXT channel
        TEXT event_type
        TEXT title
        TEXT body
        JSONB data
        TIMESTAMPTZ sent_at
        TIMESTAMPTZ read_at
        TIMESTAMPTZ clicked_at
        TEXT status
    }

    NOTIFICATION_LOG }o--|| AUTH : "references"
    CUSTOM_DOMAINS {
        UUID id PK
        UUID vendor_id FK
        VARCHAR(255) domain UK
        VARCHAR(100) subdomain
        VARCHAR(50) verification_status
        VARCHAR(255) verification_token
        VARCHAR(50) verification_method
        TIMESTAMPTZ verified_at
        VARCHAR(255) txt_name
        VARCHAR(255) txt_value
        VARCHAR(255) cname_name
        VARCHAR(255) cname_value
        VARCHAR(50) ssl_status
        VARCHAR(50) ssl_provider
        TIMESTAMPTZ ssl_issued_at
        TIMESTAMPTZ ssl_expires_at
        VARCHAR(100) cloudflare_zone_id
        VARCHAR(100) cloudflare_custom_hostname_id
        TEXT logo_url
        TEXT favicon_url
        VARCHAR(7) primary_color
        VARCHAR(7) secondary_color
        VARCHAR(100) font_family
        TEXT custom_css
        BOOLEAN is_active
        BOOLEAN is_primary
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CUSTOM_DOMAINS }o--|| AUTH : "references"
    DOMAIN_VERIFICATION_LOGS {
        UUID id PK
        UUID custom_domain_id FK
        VARCHAR(100) action
        VARCHAR(50) status
        JSONB details
        TEXT error_message
        TIMESTAMPTZ created_at
    }

    DOMAIN_VERIFICATION_LOGS }o--|| CUSTOM_DOMAINS : "references"
    IP_ALLOWLISTS {
        UUID id PK
        UUID vendor_id FK
        INET ip_address
        TEXT label
        TEXT description
        BOOLEAN enabled
        UUID added_by FK
        TIMESTAMPTZ last_matched_at
        INTEGER match_count
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    IP_ALLOWLISTS }o--|| VENDORS : "references"
    IP_ALLOWLISTS }o--|| AUTH : "references"
    IP_BLOCK_LOG {
        UUID id PK
        UUID vendor_id FK
        INET ip_address
        TEXT endpoint
        TEXT method
        TEXT user_agent
        TEXT reason
        TIMESTAMPTZ created_at
    }

    IP_BLOCK_LOG }o--|| VENDORS : "references"
    TASKS {
        uuid id PK
        uuid vendor_id FK
        uuid workspace_id FK
        text title
        text description
        task_status status
        task_priority priority
        uuid assigned_to
        uuid assigned_by
        uuid blog_post_id FK
        uuid client_id FK
        timestamptz due_date
        timestamptz started_at
        timestamptz completed_at
        text tags
        timestamptz created_at
        timestamptz updated_at
    }

    TASKS }o--|| VENDORS : "references"
    TASKS }o--|| WORKSPACES : "references"
    TASKS }o--|| BLOG_POSTS : "references"
    TASKS }o--|| CLIENTS : "references"
    TASK_COMMENTS {
        uuid id PK
        uuid task_id FK
        uuid user_id
        text user_type
        text content
        timestamptz created_at
        timestamptz updated_at
    }

    TASK_COMMENTS }o--|| TASKS : "references"
    TASK_ATTACHMENTS {
        uuid id PK
        uuid task_id FK
        text file_name
        text file_url
        integer file_size
        text mime_type
        uuid uploaded_by
        timestamptz created_at
    }

    TASK_ATTACHMENTS }o--|| TASKS : "references"
    ACTIVITIES {
        uuid id PK
        uuid vendor_id FK
        activity_type type
        text title
        text description
        uuid actor_id
        text actor_name
        text actor_type
        uuid subject_id
        text subject_type
        uuid workspace_id FK
        uuid task_id FK
        uuid blog_post_id FK
        uuid client_id FK
        jsonb metadata
        boolean is_read
        timestamptz created_at
    }

    ACTIVITIES }o--|| VENDORS : "references"
    ACTIVITIES }o--|| WORKSPACES : "references"
    ACTIVITIES }o--|| TASKS : "references"
    ACTIVITIES }o--|| BLOG_POSTS : "references"
    ACTIVITIES }o--|| CLIENTS : "references"
    GSC_CONNECTIONS {
        UUID id PK
        UUID vendor_id
        UUID client_id FK
        UUID website_id FK
        TEXT site_url
        TEXT property_name
        TEXT client_id_gsc
        TEXT client_secret_gsc
        TEXT refresh_token
        TEXT access_token
        TIMESTAMPTZ access_token_expires_at
        TEXT status
        TIMESTAMPTZ last_sync_at
        TEXT last_sync_status
        TEXT last_sync_error
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID created_by
    }

    GSC_CONNECTIONS }o--|| CLIENTS : "references"
    GSC_CONNECTIONS }o--|| WEBSITES : "references"
    CONVERSION_GOALS {
        UUID id PK
        UUID website_id FK
        TEXT name
        TEXT description
        TEXT goal_type
        TEXT ga4_event_name
        JSONB ga4_event_parameters
        NUMERIC(10, 2) target_value
        INTEGER target_count
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CONVERSION_GOALS }o--|| WEBSITES : "references"
    CSV_IMPORT_MAPPINGS {
        UUID id PK
        UUID client_id FK
        UUID user_id FK
        TEXT mapping_name
        JSONB column_mapping
        JSONB custom_fields
        BOOLEAN is_default
        TIMESTAMPTZ last_used_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CSV_IMPORT_MAPPINGS }o--|| CLIENTS : "references"
    CSV_IMPORT_MAPPINGS }o--|| AUTH : "references"
    PERSON {
        UUID id PK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TEXT email UK
        TEXT phone
        TEXT name
        TEXT company
        TEXT role
        TEXT avatar_url
        TIMESTAMP first_seen_at
        TIMESTAMP last_seen_at
        INTEGER active_days
        INTEGER total_sessions
        INTEGER engagement_score
        TEXT lifecycle_stage
        TEXT source
        TEXT utm_source
        TEXT utm_medium
        TEXT utm_campaign
        TEXT utm_term
        TEXT utm_content
        TEXT referrer
        UUID tenant_id FK
    }

    PERSON }o--|| AUTH : "references"
    IDENTITY_LINK {
        UUID id PK
        UUID person_id FK
        TIMESTAMP created_at
        TEXT source
        TEXT external_id
        JSONB metadata
    }

    IDENTITY_LINK }o--|| PERSON : "references"
    EVENT {
        UUID id PK
        UUID person_id FK
        TIMESTAMP created_at
        TEXT event_name
        TEXT event_source
        TEXT event_id
        TEXT session_id
        TEXT page_url
        TEXT referrer
        TEXT user_agent
        INET ip_address
        JSONB properties
        TEXT utm_source
        TEXT utm_medium
        TEXT utm_campaign
        TEXT utm_term
        TEXT utm_content
        UUID tenant_id FK
    }

    EVENT }o--|| PERSON : "references"
    EVENT }o--|| AUTH : "references"
    EMAIL_MESSAGE {
        UUID id PK
        UUID person_id FK
        TIMESTAMP created_at
        TEXT message_id UK
        TEXT email_to
        TEXT email_from
        TEXT subject
        TEXT template_name
        TEXT campaign_name
        JSONB tags
        TEXT status
        TIMESTAMP delivered_at
        TIMESTAMP bounced_at
        TIMESTAMP complained_at
        JSONB metadata
        UUID tenant_id FK
    }

    EMAIL_MESSAGE }o--|| PERSON : "references"
    EMAIL_MESSAGE }o--|| AUTH : "references"
    EMAIL_EVENT {
        UUID id PK
        UUID message_id FK
        UUID person_id FK
        TIMESTAMP created_at
        TEXT event_type
        TEXT link_url
        TEXT link_text
        TEXT user_agent
        INET ip_address
        JSONB metadata
        UUID tenant_id FK
    }

    EMAIL_EVENT }o--|| EMAIL_MESSAGE : "references"
    EMAIL_EVENT }o--|| PERSON : "references"
    EMAIL_EVENT }o--|| AUTH : "references"
    SUBSCRIPTION {
        UUID id PK
        UUID person_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TEXT stripe_subscription_id UK
        TEXT stripe_customer_id
        TEXT status
        TEXT plan_id
        TEXT plan_name
        TEXT billing_interval
        INTEGER amount
        TEXT currency
        INTEGER mrr
        TIMESTAMP current_period_start
        TIMESTAMP current_period_end
        TIMESTAMP trial_end
        TIMESTAMP canceled_at
        TIMESTAMP ended_at
        JSONB metadata
        UUID tenant_id FK
    }

    SUBSCRIPTION }o--|| PERSON : "references"
    SUBSCRIPTION }o--|| AUTH : "references"
    DEAL {
        UUID id PK
        UUID person_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TEXT title
        TEXT stage
        INTEGER value
        TEXT currency
        DATE expected_close_date
        TIMESTAMP closed_at
        UUID owner_id FK
        JSONB metadata
        UUID tenant_id FK
    }

    DEAL }o--|| PERSON : "references"
    DEAL }o--|| AUTH : "references"
    DEAL }o--|| AUTH : "references"
    PERSON_FEATURES {
        UUID person_id PK,FK
        TIMESTAMP updated_at
        INTEGER total_page_views
        INTEGER total_sessions
        INTEGER active_days
        INTEGER avg_session_duration_seconds
        BOOLEAN demo_requested
        BOOLEAN signup_completed
        BOOLEAN first_client_added
        BOOLEAN blog_created
        BOOLEAN blog_approved
        BOOLEAN blog_published
        BOOLEAN purchase_completed
        INTEGER clients_added_count
        INTEGER blogs_created_count
        INTEGER blogs_published_count
        INTEGER emails_sent
        INTEGER emails_opened
        INTEGER emails_clicked
        NUMERIC(5,2) email_open_rate
        NUMERIC(5,2) email_click_rate
        TIMESTAMP last_page_view_at
        TIMESTAMP last_email_opened_at
        TIMESTAMP last_email_clicked_at
        INTEGER engagement_score
        NUMERIC(5,2) conversion_probability
        UUID tenant_id FK
    }

    PERSON_FEATURES }o--|| PERSON : "references"
    PERSON_FEATURES }o--|| AUTH : "references"
    SEGMENT {
        UUID id PK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TEXT name
        TEXT slug UK
        TEXT description
        JSONB criteria
        TEXT trigger_email_campaign
        TEXT trigger_webhook_url
        INTEGER member_count
        UUID created_by FK
        BOOLEAN is_system
        UUID tenant_id FK
    }

    SEGMENT }o--|| AUTH : "references"
    SEGMENT }o--|| AUTH : "references"
    SEGMENT_MEMBERSHIP {
        UUID id PK
        UUID segment_id FK
        UUID person_id FK
        TIMESTAMP entered_at
        TIMESTAMP exited_at
        UUID tenant_id FK
    }

    SEGMENT_MEMBERSHIP }o--|| SEGMENT : "references"
    SEGMENT_MEMBERSHIP }o--|| PERSON : "references"
    SEGMENT_MEMBERSHIP }o--|| AUTH : "references"
    ANALYTICS_EVENTS {
        UUID id PK
        TEXT category
        TEXT action
        TEXT label
        NUMERIC value
        JSONB metadata
        UUID user_id FK
        TEXT session_id
        TIMESTAMPTZ timestamp
        TIMESTAMPTZ created_at
    }

    ANALYTICS_EVENTS }o--|| AUTH : "references"
    ERROR_LOGS {
        UUID id PK
        TEXT endpoint
        TEXT error_type
        TEXT error_message
        INTEGER status_code
        TEXT stack_trace
        UUID user_id FK
        JSONB metadata
        TIMESTAMPTZ timestamp
        TIMESTAMPTZ created_at
    }

    ERROR_LOGS }o--|| AUTH : "references"
    REFERRAL_PROGRAMS {
        UUID id PK
        TEXT program_type
        TEXT name
        TEXT commission_type
        DECIMAL(10,2) commission_value
        INTEGER commission_duration_months
        DECIMAL(10,2) minimum_payout
        TEXT payout_schedule
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    AFFILIATES {
        UUID id PK
        UUID user_id FK
        TEXT company_name
        TEXT contact_name
        TEXT email UK
        TEXT website
        TEXT application_notes
        TEXT promotion_methods
        TEXT audience_size
        TEXT status
        TIMESTAMPTZ approved_at
        UUID approved_by FK
        TEXT rejection_reason
        TEXT payout_method
        TEXT payout_email
        TEXT stripe_account_id
        BOOLEAN agreed_to_terms
        TIMESTAMPTZ agreed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    AFFILIATES }o--|| AUTH : "references"
    AFFILIATES }o--|| AUTH : "references"
    REFERRAL_CODES {
        UUID id PK
        UUID program_id FK
        UUID vendor_id FK
        UUID client_id FK
        UUID affiliate_id FK
        TEXT code UK
        TEXT custom_slug UK
        INTEGER clicks
        INTEGER signups
        INTEGER conversions
        BOOLEAN is_active
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }

    REFERRAL_CODES }o--|| REFERRAL_PROGRAMS : "references"
    REFERRAL_CODES }o--|| VENDORS : "references"
    REFERRAL_CODES }o--|| VENDOR_CLIENTS : "references"
    REFERRAL_CODES }o--|| AFFILIATES : "references"
    REFERRALS {
        UUID id PK
        UUID referral_code_id FK
        UUID program_id FK
        UUID referrer_vendor_id FK
        UUID referrer_client_id FK
        UUID referrer_affiliate_id FK
        UUID referred_vendor_id FK
        UUID referred_client_id FK
        TEXT status
        TIMESTAMPTZ qualified_at
        TEXT landing_page
        TEXT utm_source
        TEXT utm_medium
        TEXT utm_campaign
        TIMESTAMPTZ created_at
    }

    REFERRALS }o--|| REFERRAL_CODES : "references"
    REFERRALS }o--|| REFERRAL_PROGRAMS : "references"
    REFERRALS }o--|| VENDORS : "references"
    REFERRALS }o--|| VENDOR_CLIENTS : "references"
    REFERRALS }o--|| AFFILIATES : "references"
    REFERRALS }o--|| VENDORS : "references"
    REFERRALS }o--|| VENDOR_CLIENTS : "references"
    REFERRAL_COMMISSIONS {
        UUID id PK
        UUID referral_id FK
        UUID referral_code_id FK
        UUID referrer_vendor_id FK
        UUID referrer_affiliate_id FK
        TEXT source_type
        UUID source_id
        DECIMAL(10,2) source_amount
        DECIMAL(5,2) commission_rate
        DECIMAL(10,2) commission_amount
        TEXT status
        UUID payout_id FK
        TIMESTAMPTZ created_at
    }

    REFERRAL_COMMISSIONS }o--|| REFERRALS : "references"
    REFERRAL_COMMISSIONS }o--|| REFERRAL_CODES : "references"
    REFERRAL_COMMISSIONS }o--|| VENDORS : "references"
    REFERRAL_COMMISSIONS }o--|| AFFILIATES : "references"
    REFERRAL_COMMISSIONS }o--|| REFERRAL_PAYOUTS : "references"
    REFERRAL_PAYOUTS {
        UUID id PK
        UUID vendor_id FK
        UUID affiliate_id FK
        DECIMAL(10,2) amount
        TEXT currency
        TEXT payout_method
        JSONB payout_details
        TEXT status
        TIMESTAMPTZ processed_at
        TEXT external_reference
        TEXT notes
        TIMESTAMPTZ created_at
    }

    REFERRAL_PAYOUTS }o--|| VENDORS : "references"
    REFERRAL_PAYOUTS }o--|| AFFILIATES : "references"
    REFERRAL_CLICKS {
        UUID id PK
        UUID referral_code_id FK
        TEXT ip_hash
        TEXT user_agent
        TEXT landing_page
        TEXT referrer_url
        TEXT utm_source
        TEXT utm_medium
        TEXT utm_campaign
        BOOLEAN converted
        TIMESTAMPTZ converted_at
        UUID referral_id FK
        TIMESTAMPTZ created_at
    }

    REFERRAL_CLICKS }o--|| REFERRAL_CODES : "references"
    REFERRAL_CLICKS }o--|| REFERRALS : "references"
```
