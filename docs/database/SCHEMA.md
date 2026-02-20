# BlogCanvas Database Schema Documentation

**Generated:** 2026-02-20T01:28:43.831Z

## Overview

This document provides a comprehensive overview of the BlogCanvas database schema.

**Database:** PostgreSQL (via Supabase)
**Total Tables:** 149

## Table of Contents

- [activities](#activities)
- [activity_log](#activity-log)
- [affiliates](#affiliates)
- [agent_outputs](#agent-outputs)
- [agent_runs](#agent-runs)
- [analytics_events](#analytics-events)
- [api_key_rate_limit_buckets](#api-key-rate-limit-buckets)
- [api_key_usage](#api-key-usage)
- [api_keys](#api-keys)
- [audit_log_exports](#audit-log-exports)
- [audit_logs](#audit-logs)
- [blog_post_change_requests](#blog-post-change-requests)
- [blog_post_generated_images](#blog-post-generated-images)
- [blog_post_sections](#blog-post-sections)
- [blog_posts](#blog-posts)
- [brand_guides](#brand-guides)
- [check_back_configurations](#check-back-configurations)
- [client_invitations](#client-invitations)
- [client_notification_preferences](#client-notification-preferences)
- [client_profiles](#client-profiles)
- [clients](#clients)
- [cms_connections](#cms-connections)
- [comment_mentions](#comment-mentions)
- [comments](#comments)
- [comparison_tables](#comparison-tables)
- [competitor_audits](#competitor-audits)
- [competitor_keywords](#competitor-keywords)
- [competitors](#competitors)
- [content_approvals](#content-approvals)
- [content_gaps](#content-gaps)
- [content_requests](#content-requests)
- [content_requirements](#content-requirements)
- [content_suggestions](#content-suggestions)
- [conversion_goals](#conversion-goals)
- [csv_import_mappings](#csv-import-mappings)
- [custom_domains](#custom-domains)
- [deal](#deal)
- [domain_verification_logs](#domain-verification-logs)
- [email_attachments](#email-attachments)
- [email_delivery_tracking](#email-delivery-tracking)
- [email_event](#email-event)
- [email_message](#email-message)
- [email_messages](#email-messages)
- [email_queue](#email-queue)
- [email_threads](#email-threads)
- [error_logs](#error-logs)
- [event](#event)
- [faqs](#faqs)
- [file_access_logs](#file-access-logs)
- [file_folders](#file-folders)
- [file_shares](#file-shares)
- [file_versions](#file-versions)
- [files](#files)
- [ga4_connections](#ga4-connections)
- [generated_images](#generated-images)
- [gmail_connections](#gmail-connections)
- [gsc_connections](#gsc-connections)
- [identity_link](#identity-link)
- [invoices](#invoices)
- [ip_allowlists](#ip-allowlists)
- [ip_block_log](#ip-block-log)
- [newsletter_automation_executions](#newsletter-automation-executions)
- [newsletter_automations](#newsletter-automations)
- [newsletter_campaigns](#newsletter-campaigns)
- [newsletter_recipients](#newsletter-recipients)
- [newsletter_templates](#newsletter-templates)
- [notification_log](#notification-log)
- [notification_preferences](#notification-preferences)
- [notifications](#notifications)
- [offer_addons](#offer-addons)
- [offer_pages](#offer-pages)
- [offers](#offers)
- [onboarding_steps](#onboarding-steps)
- [outline_options](#outline-options)
- [payment_links](#payment-links)
- [person](#person)
- [person_features](#person-features)
- [pipeline_jobs](#pipeline-jobs)
- [post_requirements](#post-requirements)
- [products_services](#products-services)
- [profiles](#profiles)
- [publish_queue](#publish-queue)
- [push_subscriptions](#push-subscriptions)
- [referral_clicks](#referral-clicks)
- [referral_codes](#referral-codes)
- [referral_commissions](#referral-commissions)
- [referral_payouts](#referral-payouts)
- [referral_programs](#referral-programs)
- [referrals](#referrals)
- [review_sla_tracking](#review-sla-tracking)
- [review_tasks](#review-tasks)
- [revision_requests](#revision-requests)
- [scheduled_pipeline_runs](#scheduled-pipeline-runs)
- [scheduled_report_executions](#scheduled-report-executions)
- [scheduled_reports](#scheduled-reports)
- [scraped_pages](#scraped-pages)
- [segment](#segment)
- [segment_membership](#segment-membership)
- [stripe_accounts](#stripe-accounts)
- [stripe_webhook_events](#stripe-webhook-events)
- [subscription](#subscription)
- [subscription_plans](#subscription-plans)
- [subscriptions](#subscriptions)
- [task_attachments](#task-attachments)
- [task_comments](#task-comments)
- [tasks](#tasks)
- [transactional_email_templates](#transactional-email-templates)
- [uploaded_documents](#uploaded-documents)
- [user_2fa_audit_log](#user-2fa-audit-log)
- [user_2fa_backup_codes](#user-2fa-backup-codes)
- [user_2fa_settings](#user-2fa-settings)
- [vendor_attribution](#vendor-attribution)
- [vendor_availability](#vendor-availability)
- [vendor_calendar_integrations](#vendor-calendar-integrations)
- [vendor_client_engagement](#vendor-client-engagement)
- [vendor_clients](#vendor-clients)
- [vendor_daily_rollups](#vendor-daily-rollups)
- [vendor_deliverables](#vendor-deliverables)
- [vendor_event_log](#vendor-event-log)
- [vendor_form_submissions](#vendor-form-submissions)
- [vendor_forms](#vendor-forms)
- [vendor_funnel_stats](#vendor-funnel-stats)
- [vendor_meeting_types](#vendor-meeting-types)
- [vendor_meetings](#vendor-meetings)
- [vendor_members](#vendor-members)
- [vendor_messages](#vendor-messages)
- [vendor_order_items](#vendor-order-items)
- [vendor_orders](#vendor-orders)
- [vendor_page_daily_rollups](#vendor-page-daily-rollups)
- [vendor_revisions](#vendor-revisions)
- [vendor_sla_settings](#vendor-sla-settings)
- [vendor_subscriptions](#vendor-subscriptions)
- [vendor_team_invitations](#vendor-team-invitations)
- [vendor_workspaces](#vendor-workspaces)
- [vendors](#vendors)
- [webhook_deliveries](#webhook-deliveries)
- [webhook_events_log](#webhook-events-log)
- [webhooks](#webhooks)
- [website_insights](#website-insights)
- [website_pages](#website-pages)
- [website_scans](#website-scans)
- [websites](#websites)
- [wordpress_connections](#wordpress-connections)
- [wordpress_posts](#wordpress-posts)
- [wordpress_publish_log](#wordpress-publish-log)
- [wordpress_sites](#wordpress-sites)
- [wordpress_taxonomy_cache](#wordpress-taxonomy-cache)
- [work_declaration_updates](#work-declaration-updates)
- [work_declarations](#work-declarations)

---

## activities

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| vendor_id | uuid | No | - | FK → vendors |
| type | activity_type | No | - | - |
| title | text | No | - | - |
| description | text | Yes | - | - |
| actor_id | uuid | Yes | - | - |
| actor_name | text | Yes | - | - |
| actor_type | text | Yes | - | - |
| subject_id | uuid | Yes | - | - |
| subject_type | text | Yes | - | - |
| workspace_id | uuid | Yes | - | FK → workspaces |
| task_id | uuid | Yes | - | FK → tasks |
| blog_post_id | uuid | Yes | - | FK → blog_posts |
| client_id | uuid | Yes | - | FK → clients |
| metadata | jsonb | Yes | - | - |
| is_read | boolean | Yes | false | - |
| created_at | timestamptz | Yes | now() | - |

---

## activity_log

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| client_id | UUID | Yes | - | FK → clients |
| user_id | UUID | Yes | - | FK → profiles |
| blog_post_id | UUID | Yes | - | FK → blog_posts |
| action | TEXT | No | - | - |
| details | JSONB | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## affiliates

External affiliate partners who promote the platform

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | Yes | - | FK → auth |
| company_name | TEXT | Yes | - | - |
| contact_name | TEXT | No | - | - |
| email | TEXT | No | - | UNIQUE |
| website | TEXT | Yes | - | - |
| application_notes | TEXT | Yes | - | - |
| promotion_methods | TEXT | Yes | - | - |
| audience_size | TEXT | Yes | - | - |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| approved_at | TIMESTAMPTZ | Yes | - | - |
| approved_by | UUID | Yes | - | FK → auth |
| rejection_reason | TEXT | Yes | - | - |
| payout_method | TEXT | Yes | 'paypal' CHECK (payout_method IN ('stripe' | - |
| payout_email | TEXT | Yes | - | - |
| stripe_account_id | TEXT | Yes | - | - |
| agreed_to_terms | BOOLEAN | Yes | false | - |
| agreed_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## agent_outputs

Stores AI agent inputs and outputs for the blog post generation pipeline. Used for debugging, replay, and audit trail.

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | Yes | - | FK → blog_posts |
| agent_name | TEXT | No | - | - |
| agent_version | TEXT | Yes | '1.0' | - |
| input | JSONB | Yes | - | - |
| output | JSONB | Yes | - | - |
| duration_ms | INTEGER | Yes | - | - |
| model_used | TEXT | Yes | - | - |
| token_count | INTEGER | Yes | - | - |
| status | TEXT | Yes | 'completed' | - |
| error_message | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| agent_name | IN | Yes | - | - |
| status | IN | Yes | - | - |

---

## agent_runs

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| blog_post_id | uuid | Yes | - | FK → blog_posts |
| agent_name | text | No | - | - |
| status | text | No | - | - |
| input_summary | jsonb | Yes | - | - |
| output_summary | jsonb | Yes | - | - |
| error_message | text | Yes | - | - |
| started_at | timestamptz | Yes | now() | - |
| finished_at | timestamptz | Yes | - | - |

---

## analytics_events

Stores user interaction events for analytics and tracking

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| category | TEXT | No | - | - |
| action | TEXT | No | - | - |
| label | TEXT | Yes | - | - |
| value | NUMERIC | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| user_id | UUID | Yes | - | FK → auth |
| session_id | TEXT | Yes | - | - |
| timestamp | TIMESTAMPTZ | No | NOW() | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## api_key_rate_limit_buckets

Rate limiting counters for API keys

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| api_key_id | UUID | No | - | FK → api_keys |
| window_type | VARCHAR(20) | No | - | - |
| window_start | TIMESTAMPTZ | No | - | - |
| request_count | INTEGER | No | 0 | - |
| created_at | TIMESTAMPTZ | No | now() | - |
| updated_at | TIMESTAMPTZ | No | now() | - |

---

## api_key_usage

Tracks API key usage for analytics and auditing

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| api_key_id | UUID | No | - | FK → api_keys |
| endpoint | VARCHAR(255) | No | - | - |
| method | VARCHAR(10) | No | - | - |
| status_code | INTEGER | No | - | - |
| response_time_ms | INTEGER | Yes | - | - |
| ip_address | INET | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | No | now() | - |

---

## api_keys

API keys for programmatic access to the BlogCanvas API

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| name | VARCHAR(255) | No | - | - |
| key_prefix | VARCHAR(10) | No | - | - |
| key_hash | VARCHAR(255) | No | - | - |
| scopes | JSONB | No | '[]'::jsonb | - |
| is_active | BOOLEAN | No | true | - |
| last_used_at | TIMESTAMPTZ | Yes | - | - |
| expires_at | TIMESTAMPTZ | Yes | - | - |
| rate_limit_per_minute | INTEGER | No | 60 | - |
| rate_limit_per_hour | INTEGER | No | 1000 | - |
| rate_limit_per_day | INTEGER | No | 10000 | - |
| created_at | TIMESTAMPTZ | No | now() | - |
| updated_at | TIMESTAMPTZ | No | now() | - |
| created_by | UUID | Yes | - | FK → auth |

---

## audit_log_exports

Tracks exports of audit logs for compliance reporting

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | Yes | - | FK → auth |
| vendor_id | UUID | Yes | - | FK → vendors |
| export_type | TEXT | No | - | - |
| filters | JSONB | Yes | - | - |
| record_count | INTEGER | No | - | - |
| file_size_bytes | BIGINT | Yes | - | - |
| file_path | TEXT | Yes | - | - |
| status | TEXT | No | 'pending' CHECK (status IN ('pending' | - |
| error_message | TEXT | Yes | - | - |
| started_at | TIMESTAMPTZ | Yes | NOW() | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## audit_logs

Audit trail of all changes to important entities

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | Yes | - | FK → auth |
| vendor_id | UUID | Yes | - | FK → vendors |
| client_id | UUID | Yes | - | FK → clients |
| api_key_id | UUID | Yes | - | FK → api_keys |
| action_type | TEXT | No | - | - |
| resource_type | TEXT | No | - | - |
| resource_id | UUID | Yes | - | - |
| endpoint | TEXT | No | - | - |
| method | TEXT | No | - | - |
| status_code | INTEGER | Yes | - | - |
| changes | JSONB | Yes | - | - |
| metadata | jsonb | Yes | - | - |
| ip_address | inet | Yes | - | - |
| user_agent | text | Yes | - | - |
| session_id | TEXT | Yes | - | - |
| duration_ms | INTEGER | Yes | - | - |
| success | BOOLEAN | Yes | true | - |
| error_message | TEXT | Yes | - | - |
| created_at | timestamp | Yes | now() | - |
| table_name | text | No | - | - |
| record_id | uuid | No | - | - |
| action | text | No | - | - |
| user_email | text | Yes | - | - |
| old_values | jsonb | Yes | - | - |
| new_values | jsonb | Yes | - | - |
| changed_fields | text | Yes | - | - |

---

## blog_post_change_requests

Tracks client change requests for blog posts during review (feat-087)

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | No | - | FK → blog_posts |
| requested_by | UUID | No | - | - |
| requested_at | TIMESTAMPTZ | No | NOW() | - |
| feedback | TEXT | No | - | - |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| resolved_at | TIMESTAMPTZ | Yes | - | - |
| resolved_by | UUID | Yes | - | - |
| resolution_notes | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## blog_post_generated_images

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| blog_post_id | uuid | No | - | FK → blog_posts |
| prompt | text | No | - | - |
| revised_prompt | text | Yes | - | - |
| image_url | text | No | - | - |
| storage_path | text | Yes | - | - |
| model | text | Yes | 'dall-e-3' | - |
| size | text | Yes | '1024x1024' | - |
| quality | text | Yes | 'standard' | - |
| style | text | Yes | 'natural' | - |
| is_selected | boolean | Yes | false | - |
| is_featured | boolean | Yes | false | - |
| generation_status | text | Yes | 'generated' | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## blog_post_sections

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| blog_post_id | uuid | Yes | - | FK → blog_posts |
| section_key | text | No | - | - |
| title | text | Yes | - | - |
| type | text | Yes | - | - |
| order_index | int | No | - | - |
| content | text | Yes | - | - |
| ai_content | jsonb | Yes | - | - |
| needs_human | boolean | Yes | false | - |
| human_prompt | text | Yes | - | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## blog_posts

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| client_id | uuid | Yes | - | FK → clients |
| topic | text | No | - | - |
| target_keyword | text | Yes | - | - |
| status | blog_post_status | Yes | 'idea' | - |
| tone_of_voice | text | Yes | - | - |
| target_audience | text | Yes | - | - |
| word_count_goal | int | Yes | - | - |
| goal | text | Yes | - | - |
| seo_notes | text | Yes | - | - |
| research_context | jsonb | Yes | - | - |
| outline | jsonb | Yes | - | - |
| draft | jsonb | Yes | - | - |
| seo_metadata | jsonb | Yes | - | - |
| image_briefs | jsonb | Yes | - | - |
| final_html | text | Yes | - | - |
| cms_publish_info | jsonb | Yes | - | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## brand_guides

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| name | TEXT | No | - | - |
| source | TEXT | Yes | - | - |
| source_url | TEXT | Yes | - | - |
| brand_name | TEXT | Yes | - | - |
| tagline | TEXT | Yes | - | - |
| voice_traits | JSONB | Yes | - | - |
| tone_guidelines | JSONB | Yes | - | - |
| messaging_hierarchy | JSONB | Yes | - | - |
| donts | JSONB | Yes | - | - |
| products_services | JSONB | Yes | - | - |
| target_audiences | JSONB | Yes | - | - |
| value_propositions | JSONB | Yes | - | - |
| full_content | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## check_back_configurations

Stores customizable check-back schedules per website (e.g., Day 7, 30, 60, 90)

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | Yes | - | FK → websites |
| intervals | JSONB | No | '[7 | - |
| enabled | BOOLEAN | No | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## client_invitations

Stores invitation tokens for client users to join their organization

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| client_id | UUID | No | - | FK → clients |
| email | TEXT | No | - | - |
| token | TEXT | No | - | UNIQUE |
| role | TEXT | No | - | - |
| invited_by | UUID | Yes | - | FK → profiles |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| accepted_at | TIMESTAMPTZ | Yes | - | - |
| expires_at | TIMESTAMPTZ | No | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## client_notification_preferences

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| client_id | UUID | Yes | - | FK → clients |
| notify_on_draft_ready | BOOLEAN | Yes | true | - |
| notify_before_publish | BOOLEAN | Yes | true | - |
| notify_hours_before | INTEGER | Yes | 24 | - |
| weekly_summary | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## client_profiles

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| client_id | uuid | Yes | - | FK → clients |
| product_service_summary | text | Yes | - | - |
| target_audience | text | Yes | - | - |
| positioning | text | Yes | - | - |
| tone_of_voice | text | Yes | - | - |
| competitors | text | Yes | - | - |
| keywords | jsonb | Yes | - | - |
| locations | jsonb | Yes | - | - |
| acquisition_channels | jsonb | Yes | - | - |
| extra_notes | text | Yes | - | - |
| updated_at | timestamptz | Yes | now() | - |

---

## clients

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| owner_id | uuid | No | - | FK → auth |
| name | text | No | - | - |
| primary_contact_email | text | Yes | - | - |
| website_url | text | Yes | - | - |
| has_website | boolean | Yes | false | - |
| created_at | timestamptz | Yes | now() | - |

---

## cms_connections

CMS connection credentials and settings per client

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() PRIMARY KEY | PRIMARY KEY |
| client_id | UUID | No | - | FK → clients |
| cms_type | TEXT | No | - | - |
| base_url | TEXT | No | - | - |
| auth_payload | JSONB | No | - | - |
| created_at | TIMESTAMP | Yes | NOW() | - |
| connection_status | TEXT | Yes | 'active' CHECK (connection_status IN ('active' | - |
| last_tested_at | TIMESTAMP | Yes | - | - |
| test_result | JSONB | Yes | - | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| created_by | UUID | Yes | - | FK → auth |

---

## comment_mentions

Tracks @mentions in comments for notification purposes

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| comment_id | uuid | No | - | FK → comments |
| mentioned_user_id | uuid | No | - | FK → auth |
| notification_sent | boolean | Yes | false | - |
| created_at | timestamptz | Yes | now() | - |

---

## comments

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| blog_post_id | uuid | Yes | - | FK → blog_posts |
| section_id | uuid | Yes | - | FK → blog_post_sections |
| user_id | uuid | Yes | - | - |
| author_name | text | Yes | - | - |
| content | text | No | - | - |
| resolved | boolean | Yes | false | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## comparison_tables

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| brand_guide_id | UUID | Yes | - | FK → brand_guides |
| title | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| columns | JSONB | Yes | - | - |
| rows | JSONB | Yes | - | - |
| category | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## competitor_audits

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| competitor_id | UUID | No | - | FK → competitors |
| seo_score | INTEGER | Yes | - | - |
| pages_indexed | INTEGER | Yes | - | - |
| audit_date | TIMESTAMPTZ | Yes | NOW() | - |
| raw_metrics | JSONB | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## competitor_keywords

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| competitor_id | UUID | No | - | FK → competitors |
| keyword | TEXT | No | - | - |
| search_volume | INTEGER | Yes | - | - |
| difficulty | INTEGER | Yes | - | - |
| ranking_position | INTEGER | Yes | - | - |
| ranking_url | TEXT | Yes | - | - |
| search_intent | TEXT | Yes | - | - |
| we_rank | BOOLEAN | Yes | false | - |
| our_position | INTEGER | Yes | - | - |
| gap_priority | INTEGER | Yes | - | - |
| discovered_at | TIMESTAMPTZ | Yes | NOW() | - |
| last_checked_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## competitors

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | No | - | FK → websites |
| competitor_url | TEXT | No | - | - |
| competitor_domain | TEXT | No | - | - |
| name | TEXT | Yes | - | - |
| notes | TEXT | Yes | - | - |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| last_analyzed_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## content_approvals

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | Yes | - | FK → blog_posts |
| batch_id | UUID | Yes | - | FK → content_batches |
| action | TEXT | No | - | - |
| actor_id | UUID | Yes | - | FK → profiles |
| actor_type | TEXT | No | - | - |
| comment | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## content_gaps

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | Yes | - | FK → websites |
| gap_type | TEXT | No | - | - |
| severity | TEXT | Yes | 'medium' | - |
| title | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| suggested_action | TEXT | Yes | - | - |
| affected_pages | JSONB | Yes | - | - |
| metadata | JSONB | Yes | - | - |
| status | TEXT | Yes | 'open' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| resolved_at | TIMESTAMPTZ | Yes | - | - |

---

## content_requests

Stores client requests for new content (blogs, batches, etc.)

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | uuid_generate_v4() | PRIMARY KEY |
| client_id | UUID | No | - | FK → clients |
| vendor_id | UUID | No | - | FK → vendors |
| requested_by | UUID | No | - | FK → profiles |
| content_type | VARCHAR(50) | No | - | - |
| title | VARCHAR(255) | Yes | - | - |
| message | TEXT | No | - | - |
| priority | VARCHAR(20) | Yes | 'normal' CHECK (priority IN ('low' | - |
| status | VARCHAR(50) | Yes | 'pending' CHECK (status IN ('pending' | - |
| vendor_response | TEXT | Yes | - | - |
| responded_at | TIMESTAMPTZ | Yes | - | - |
| responded_by | UUID | Yes | - | FK → profiles |
| result_blog_post_id | UUID | Yes | - | FK → blog_posts |
| result_batch_id | UUID | Yes | - | FK → content_batches |
| attachments | JSONB | Yes | '[]' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## content_requirements

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| template_name | TEXT | No | - | - |
| content_type | TEXT | Yes | - | - |
| required_sections | JSONB | Yes | - | - |
| optional_elements | JSONB | Yes | - | - |
| word_count_range | JSONB | Yes | - | - |
| seo_requirements | JSONB | Yes | - | - |
| tone | TEXT | Yes | - | - |
| target_audience | TEXT | Yes | - | - |
| is_default | BOOLEAN | Yes | BOOLEAN DEFAULT false | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## content_suggestions

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | Yes | - | FK → websites |
| gap_id | UUID | Yes | - | FK → content_gaps |
| suggestion_type | TEXT | No | - | - |
| title | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| estimated_impact | TEXT | Yes | - | - |
| target_keyword | TEXT | Yes | - | - |
| estimated_word_count | INTEGER | Yes | - | - |
| outline | JSONB | Yes | - | - |
| reasoning | TEXT | Yes | - | - |
| priority | INTEGER | Yes | 0 | - |
| status | TEXT | Yes | 'suggested' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## conversion_goals

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | No | - | FK → websites |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| goal_type | TEXT | No | - | - |
| ga4_event_name | TEXT | Yes | - | - |
| ga4_event_parameters | JSONB | Yes | - | - |
| target_value | NUMERIC(10, 2) | Yes | - | - |
| target_count | INTEGER | Yes | - | - |
| is_active | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## csv_import_mappings

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| client_id | UUID | No | - | FK → clients |
| user_id | UUID | Yes | - | FK → auth |
| mapping_name | TEXT | No | 'Default' | - |
| column_mapping | JSONB | No | '{}'::jsonb | - |
| custom_fields | JSONB | Yes | '[]'::jsonb | - |
| is_default | BOOLEAN | Yes | BOOLEAN DEFAULT false | - |
| last_used_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | now() | - |
| updated_at | TIMESTAMPTZ | Yes | now() | - |

---

## custom_domains

Custom domains for vendor white-labeling

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → auth |
| domain | VARCHAR(255) | No | - | UNIQUE |
| subdomain | VARCHAR(100) | Yes | - | - |
| verification_status | VARCHAR(50) | No | 'pending' | - |
| verification_token | VARCHAR(255) | No | - | - |
| verification_method | VARCHAR(50) | No | 'txt' | - |
| verified_at | TIMESTAMPTZ | Yes | - | - |
| txt_name | VARCHAR(255) | Yes | - | - |
| txt_value | VARCHAR(255) | Yes | - | - |
| cname_name | VARCHAR(255) | Yes | - | - |
| cname_value | VARCHAR(255) | Yes | - | - |
| ssl_status | VARCHAR(50) | No | 'pending' | - |
| ssl_provider | VARCHAR(50) | Yes | 'lets_encrypt' | - |
| ssl_issued_at | TIMESTAMPTZ | Yes | - | - |
| ssl_expires_at | TIMESTAMPTZ | Yes | - | - |
| cloudflare_zone_id | VARCHAR(100) | Yes | - | - |
| cloudflare_custom_hostname_id | VARCHAR(100) | Yes | - | - |
| logo_url | TEXT | Yes | - | - |
| favicon_url | TEXT | Yes | - | - |
| primary_color | VARCHAR(7) | Yes | - | - |
| secondary_color | VARCHAR(7) | Yes | - | - |
| font_family | VARCHAR(100) | Yes | - | - |
| custom_css | TEXT | Yes | - | - |
| is_active | BOOLEAN | No | false | - |
| is_primary | BOOLEAN | No | false | - |
| created_at | TIMESTAMPTZ | No | NOW() | - |
| updated_at | TIMESTAMPTZ | No | NOW() | - |

---

## deal

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| person_id | UUID | Yes | - | FK → person |
| created_at | TIMESTAMP | Yes | NOW() | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| title | TEXT | No | - | - |
| stage | TEXT | No | - | - |
| value | INTEGER | Yes | - | - |
| currency | TEXT | Yes | 'usd' | - |
| expected_close_date | DATE | Yes | - | - |
| closed_at | TIMESTAMP | Yes | - | - |
| owner_id | UUID | Yes | - | FK → auth |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## domain_verification_logs

Audit trail for domain verification and SSL provisioning

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| custom_domain_id | UUID | No | - | FK → custom_domains |
| action | VARCHAR(100) | No | - | - |
| status | VARCHAR(50) | No | - | - |
| details | JSONB | Yes | - | - |
| error_message | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | No | NOW() | - |

---

## email_attachments

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| email_message_id | UUID | Yes | - | FK → email_messages |
| gmail_attachment_id | TEXT | Yes | - | - |
| filename | TEXT | No | - | - |
| mime_type | TEXT | Yes | - | - |
| size_bytes | INT | Yes | - | - |
| storage_path | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## email_delivery_tracking

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| email_queue_id | UUID | Yes | - | FK → email_queue |
| resend_id | TEXT | No | - | - |
| event_type | TEXT | No | - | - |
| event_data | JSONB | Yes | '{}'::JSONB | - |
| occurred_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## email_event

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| message_id | UUID | Yes | - | FK → email_message |
| person_id | UUID | Yes | - | FK → person |
| created_at | TIMESTAMP | Yes | NOW() | - |
| event_type | TEXT | No | - | - |
| link_url | TEXT | Yes | - | - |
| link_text | TEXT | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| ip_address | INET | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## email_message

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| person_id | UUID | Yes | - | FK → person |
| created_at | TIMESTAMP | Yes | NOW() | - |
| message_id | TEXT | No | - | UNIQUE |
| email_to | TEXT | No | - | - |
| email_from | TEXT | No | - | - |
| subject | TEXT | Yes | - | - |
| template_name | TEXT | Yes | - | - |
| campaign_name | TEXT | Yes | - | - |
| tags | JSONB | Yes | '[]'::jsonb | - |
| status | TEXT | Yes | 'sent' | - |
| delivered_at | TIMESTAMP | Yes | - | - |
| bounced_at | TIMESTAMP | Yes | - | - |
| complained_at | TIMESTAMP | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## email_messages

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| email_thread_id | UUID | Yes | - | FK → email_threads |
| gmail_message_id | TEXT | No | - | - |
| from_address | TEXT | No | - | - |
| to_addresses | TEXT | Yes | - | - |
| cc_addresses | TEXT | Yes | - | - |
| bcc_addresses | TEXT | Yes | - | - |
| subject | TEXT | Yes | - | - |
| body_text | TEXT | Yes | - | - |
| body_html | TEXT | Yes | - | - |
| sent_at | TIMESTAMPTZ | No | - | - |
| is_draft | BOOLEAN | Yes | FALSE | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## email_queue

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| template_key | TEXT | Yes | - | FK → transactional_email_templates |
| to_email | TEXT | No | - | - |
| to_name | TEXT | Yes | - | - |
| from_email | TEXT | Yes | 'BlogCanvas <noreply@blogcanvas.app>' | - |
| subject | TEXT | No | - | - |
| html_content | TEXT | No | - | - |
| text_content | TEXT | Yes | - | - |
| variables | JSONB | Yes | '{}'::JSONB | - |
| status | TEXT | Yes | 'pending' | - |
| priority | INT | Yes | 5 | - |
| attempts | INT | Yes | 0 | - |
| max_attempts | INT | Yes | 3 | - |
| scheduled_at | TIMESTAMPTZ | Yes | NOW() | - |
| sent_at | TIMESTAMPTZ | Yes | - | - |
| failed_at | TIMESTAMPTZ | Yes | - | - |
| error_message | TEXT | Yes | - | - |
| resend_id | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}'::JSONB | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## email_threads

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| gmail_connection_id | UUID | Yes | - | FK → gmail_connections |
| client_id | UUID | Yes | - | FK → clients |
| project_id | UUID | Yes | - | FK → content_batches |
| gmail_thread_id | TEXT | No | - | - |
| subject | TEXT | Yes | - | - |
| snippet | TEXT | Yes | - | - |
| last_message_at | TIMESTAMPTZ | Yes | - | - |
| message_count | INT | Yes | 0 | - |
| is_read | BOOLEAN | Yes | TRUE | - |
| labels | TEXT | Yes | - | - |
| participants | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## error_logs

Stores application errors for monitoring and analysis

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| endpoint | TEXT | No | - | - |
| error_type | TEXT | No | - | - |
| error_message | TEXT | No | - | - |
| status_code | INTEGER | Yes | - | - |
| stack_trace | TEXT | Yes | - | - |
| user_id | UUID | Yes | - | FK → auth |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| timestamp | TIMESTAMPTZ | No | NOW() | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## event

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| person_id | UUID | Yes | - | FK → person |
| created_at | TIMESTAMP | Yes | NOW() | - |
| event_name | TEXT | No | - | - |
| event_source | TEXT | No | - | - |
| event_id | TEXT | Yes | - | - |
| session_id | TEXT | Yes | - | - |
| page_url | TEXT | Yes | - | - |
| referrer | TEXT | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| ip_address | INET | Yes | - | - |
| properties | JSONB | Yes | '{}'::jsonb | - |
| utm_source | TEXT | Yes | - | - |
| utm_medium | TEXT | Yes | - | - |
| utm_campaign | TEXT | Yes | - | - |
| utm_term | TEXT | Yes | - | - |
| utm_content | TEXT | Yes | - | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## faqs

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| brand_guide_id | UUID | Yes | - | FK → brand_guides |
| category | TEXT | Yes | - | - |
| question | TEXT | No | - | - |
| answer | TEXT | No | - | - |
| keywords | JSONB | Yes | - | - |
| usage_count | INTEGER | Yes | 0 | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## file_access_logs

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| file_id | UUID | No | - | FK → files |
| user_id | UUID | Yes | - | FK → auth |
| share_id | UUID | Yes | - | FK → file_shares |
| action | TEXT | No | - | - |
| ip_address | TEXT | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| accessed_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## file_folders

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| name | TEXT | No | - | - |
| parent_folder_id | UUID | Yes | - | FK → file_folders |
| client_id | UUID | Yes | - | FK → clients |
| vendor_id | UUID | Yes | - | FK → vendors |
| description | TEXT | Yes | - | - |
| color | TEXT | Yes | '#3B82F6' | - |
| icon | TEXT | Yes | 'folder' | - |
| is_system | BOOLEAN | Yes | false | - |
| created_by | UUID | Yes | - | FK → auth |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## file_shares

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| file_id | UUID | No | - | FK → files |
| share_token | TEXT | No | - | UNIQUE |
| permission | TEXT | Yes | 'view' CHECK (permission IN ('view' | - |
| expires_at | TIMESTAMPTZ | Yes | - | - |
| is_password_protected | BOOLEAN | Yes | false | - |
| password_hash | TEXT | Yes | - | - |
| max_downloads | INTEGER | Yes | - | - |
| download_count | INTEGER | Yes | 0 | - |
| view_count | INTEGER | Yes | 0 | - |
| last_accessed_at | TIMESTAMPTZ | Yes | - | - |
| shared_by | UUID | Yes | - | FK → auth |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| revoked_at | TIMESTAMPTZ | Yes | - | - |
| revoked_at | IS | Yes | - | - |

---

## file_versions

Stores version history for files, allowing revision tracking and restoration

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| file_id | UUID | No | - | FK → files |
| version_number | INTEGER | No | - | - |
| storage_path | TEXT | No | - | - |
| storage_bucket | TEXT | Yes | 'client-files' | - |
| filename | TEXT | No | - | - |
| file_type | TEXT | No | - | - |
| file_size | BIGINT | No | - | - |
| title | TEXT | Yes | - | - |
| description | TEXT | Yes | - | - |
| tags | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}' | - |
| change_summary | TEXT | Yes | - | - |
| is_current | BOOLEAN | Yes | false | - |
| uploaded_by | UUID | Yes | - | FK → auth |
| uploaded_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## files

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| filename | TEXT | No | - | - |
| original_filename | TEXT | No | - | - |
| file_type | TEXT | No | - | - |
| file_extension | TEXT | Yes | - | - |
| file_size | BIGINT | No | - | - |
| storage_path | TEXT | No | - | UNIQUE |
| storage_bucket | TEXT | Yes | 'client-files' | - |
| folder_id | UUID | Yes | - | FK → file_folders |
| client_id | UUID | Yes | - | FK → clients |
| vendor_id | UUID | Yes | - | FK → vendors |
| title | TEXT | Yes | - | - |
| description | TEXT | Yes | - | - |
| tags | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}' | - |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| is_public | BOOLEAN | Yes | false | - |
| related_post_id | UUID | Yes | - | FK → blog_posts |
| related_batch_id | UUID | Yes | - | FK → content_batches |
| related_work_id | UUID | Yes | - | FK → work_declarations |
| uploaded_by | UUID | Yes | - | FK → auth |
| uploaded_at | TIMESTAMPTZ | Yes | NOW() | - |
| is_processed | BOOLEAN | Yes | false | - |
| processing_status | TEXT | Yes | 'pending' CHECK (processing_status IN ('pending' | - |
| processing_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |
| last_accessed_at | TIMESTAMPTZ | Yes | - | - |

---

## ga4_connections

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | - |
| client_id | UUID | Yes | - | FK → clients |
| website_id | UUID | Yes | - | FK → websites |
| property_id | TEXT | No | - | - |
| property_name | TEXT | Yes | - | - |
| service_account_email | TEXT | No | - | - |
| service_account_credentials | JSONB | No | - | - |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| last_sync_at | TIMESTAMPTZ | Yes | - | - |
| last_sync_status | TEXT | Yes | - | - |
| last_sync_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_by | UUID | Yes | - | - |

---

## generated_images

Stores AI-generated images for blog posts with generation metadata and selection status

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| blog_post_id | uuid | No | - | FK → blog_posts |
| prompt | text | No | - | - |
| model | text | No | 'dall-e-3' | - |
| size | text | No | '1024x1024' | - |
| quality | text | Yes | 'standard' | - |
| style | text | Yes | 'natural' | - |
| storage_path | text | No | - | - |
| storage_bucket | text | No | 'blog-images' | - |
| url | text | No | - | - |
| file_size | bigint | Yes | - | - |
| mime_type | text | Yes | 'image/png' | - |
| width | int | Yes | - | - |
| height | int | Yes | - | - |
| is_selected | boolean | Yes | false | - |
| is_featured | boolean | Yes | false | - |
| position | text | Yes | - | - |
| alt_text | text | Yes | - | - |
| caption | text | Yes | - | - |
| revised_prompt | text | Yes | - | - |
| generation_metadata | jsonb | Yes | - | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |
| deleted_at | timestamptz | Yes | - | - |

---

## gmail_connections

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | Yes | - | FK → auth |
| vendor_id | UUID | Yes | - | FK → vendors |
| gmail_address | TEXT | No | - | - |
| access_token_encrypted | TEXT | Yes | - | - |
| refresh_token_encrypted | TEXT | Yes | - | - |
| token_expires_at | TIMESTAMPTZ | Yes | - | - |
| sync_enabled | BOOLEAN | Yes | TRUE | - |
| last_sync_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## gsc_connections

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | - |
| client_id | UUID | Yes | - | FK → clients |
| website_id | UUID | Yes | - | FK → websites |
| site_url | TEXT | No | - | - |
| property_name | TEXT | Yes | - | - |
| client_id_gsc | TEXT | No | - | - |
| client_secret_gsc | TEXT | No | - | - |
| refresh_token | TEXT | No | - | - |
| access_token | TEXT | Yes | - | - |
| access_token_expires_at | TIMESTAMPTZ | Yes | - | - |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| last_sync_at | TIMESTAMPTZ | Yes | - | - |
| last_sync_status | TEXT | Yes | - | - |
| last_sync_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_by | UUID | Yes | - | - |

---

## identity_link

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| person_id | UUID | No | - | FK → person |
| created_at | TIMESTAMP | Yes | NOW() | - |
| source | TEXT | No | - | - |
| external_id | TEXT | No | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |

---

## invoices

Invoices generated for projects or subscriptions

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| client_id | UUID | No | - | FK → clients |
| subscription_id | UUID | Yes | - | FK → subscriptions |
| stripe_invoice_id | TEXT | Yes | - | UNIQUE |
| stripe_payment_intent_id | TEXT | Yes | - | - |
| amount_due | INTEGER | No | - | - |
| amount_paid | INTEGER | Yes | 0 | - |
| currency | TEXT | Yes | 'usd' | - |
| status | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| invoice_number | TEXT | Yes | - | - |
| invoice_pdf_url | TEXT | Yes | - | - |
| hosted_invoice_url | TEXT | Yes | - | - |
| due_date | TIMESTAMPTZ | Yes | - | - |
| paid_at | TIMESTAMPTZ | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## ip_allowlists

IP allowlist rules for vendor security

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| ip_address | INET | No | - | - |
| label | TEXT | Yes | - | - |
| description | TEXT | Yes | - | - |
| enabled | BOOLEAN | No | true NOT NULL | - |
| added_by | UUID | Yes | - | FK → auth |
| last_matched_at | TIMESTAMPTZ | Yes | - | - |
| match_count | INTEGER | Yes | 0 | - |
| created_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |
| updated_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |

---

## ip_block_log

Log of blocked IP access attempts

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| ip_address | INET | No | - | - |
| endpoint | TEXT | No | - | - |
| method | TEXT | No | - | - |
| user_agent | TEXT | Yes | - | - |
| reason | TEXT | Yes | 'IP not in allowlist' | - |
| created_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |

---

## newsletter_automation_executions

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| automation_id | UUID | No | - | FK → newsletter_automations |
| campaign_id | UUID | Yes | - | FK → newsletter_campaigns |
| executed_at | TIMESTAMPTZ | Yes | NOW() | - |
| status | VARCHAR(50) | No | - | - |
| error_message | TEXT | Yes | - | - |
| recipients_count | INTEGER | Yes | 0 | - |
| emails_sent | INTEGER | Yes | 0 | - |
| emails_failed | INTEGER | Yes | 0 | - |

---

## newsletter_automations

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| template_id | UUID | Yes | - | FK → newsletter_templates |
| name | VARCHAR(255) | No | - | - |
| description | TEXT | Yes | - | - |
| trigger_type | VARCHAR(50) | No | - | - |
| trigger_config | JSONB | Yes | '{}'::jsonb | - |
| subject | VARCHAR(255) | Yes | - | - |
| preview_text | TEXT | Yes | - | - |
| html_content | TEXT | Yes | - | - |
| json_content | JSONB | Yes | - | - |
| recipient_selection | VARCHAR(50) | No | - | - |
| recipient_config | JSONB | Yes | '{}'::jsonb | - |
| enabled | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |
| last_executed_at | TIMESTAMPTZ | Yes | - | - |
| next_execution_at | TIMESTAMPTZ | Yes | - | - |
| execution_count | INTEGER | Yes | 0 | - |

---

## newsletter_campaigns

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → vendors |
| template_id | UUID | Yes | - | FK → newsletter_templates |
| subject | TEXT | No | - | - |
| preview_text | TEXT | Yes | - | - |
| html_content | TEXT | No | - | - |
| json_content | JSONB | Yes | - | - |
| status | TEXT | Yes | 'draft' | - |
| scheduled_at | TIMESTAMPTZ | Yes | - | - |
| sent_at | TIMESTAMPTZ | Yes | - | - |
| recipient_count | INT | Yes | 0 | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## newsletter_recipients

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| campaign_id | UUID | Yes | - | FK → newsletter_campaigns |
| email | TEXT | No | - | - |
| client_id | UUID | Yes | - | FK → clients |
| status | TEXT | Yes | 'pending' | - |
| sent_at | TIMESTAMPTZ | Yes | - | - |
| opened_at | TIMESTAMPTZ | Yes | - | - |
| clicked_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## newsletter_templates

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → vendors |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| html_content | TEXT | No | - | - |
| json_content | JSONB | Yes | - | - |
| thumbnail_url | TEXT | Yes | - | - |
| is_system_template | BOOLEAN | Yes | FALSE | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## notification_log

Log of all sent notifications for analytics and debugging

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | No | - | FK → auth |
| channel | TEXT | No | - | - |
| event_type | TEXT | No | - | - |
| title | TEXT | No | - | - |
| body | TEXT | No | - | - |
| data | JSONB | Yes | '{}'::jsonb | - |
| sent_at | TIMESTAMPTZ | Yes | NOW() | - |
| read_at | TIMESTAMPTZ | Yes | - | - |
| clicked_at | TIMESTAMPTZ | Yes | - | - |
| status | TEXT | Yes | 'sent' CHECK (status IN ('sent' | - |

---

## notification_preferences

Stores user notification preferences for email and in-app notifications

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | No | - | FK → auth |
| channel | TEXT | No | - | - |
| event_type | TEXT | No | - | - |
| enabled | BOOLEAN | Yes | true | - |
| created_at | timestamp | Yes | now() | - |
| updated_at | timestamp | Yes | now() | - |
| email_new_order | boolean | Yes | true | - |
| email_order_update | boolean | Yes | true | - |
| email_message | boolean | Yes | true | - |
| email_content_approved | boolean | Yes | true | - |
| email_content_rejected | boolean | Yes | true | - |
| email_meeting_reminder | boolean | Yes | true | - |
| email_weekly_summary | boolean | Yes | false | - |
| in_app_new_order | boolean | Yes | true | - |
| in_app_message | boolean | Yes | true | - |
| in_app_content_update | boolean | Yes | true | - |

---

## notifications

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | No | - | FK → profiles |
| type | TEXT | No | - | - |
| title | TEXT | No | - | - |
| message | TEXT | Yes | - | - |
| link | TEXT | Yes | - | - |
| read | BOOLEAN | Yes | false | - |
| read_at | TIMESTAMPTZ | Yes | - | - |
| email_sent | BOOLEAN | Yes | false | - |
| email_sent_at | TIMESTAMPTZ | Yes | - | - |
| metadata | JSONB | Yes | '{}' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## offer_addons

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| offer_id | UUID | No | - | FK → offers |
| vendor_id | UUID | No | - | FK → vendors |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| addon_type | TEXT | No | - | - |
| price | DECIMAL(10, 2) | No | - | - |
| currency | TEXT | Yes | 'USD' | - |
| stripe_product_id | TEXT | Yes | - | - |
| stripe_price_id | TEXT | Yes | - | - |
| is_active | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## offer_pages

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| title | TEXT | No | - | - |
| slug | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| blocks | JSONB | Yes | '[]'::jsonb | - |
| meta_title | TEXT | Yes | - | - |
| meta_description | TEXT | Yes | - | - |
| og_image_url | TEXT | Yes | - | - |
| is_published | BOOLEAN | Yes | false | - |
| published_at | TIMESTAMPTZ | Yes | - | - |
| view_count | INTEGER | Yes | 0 | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## offers

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| page_id | UUID | No | - | FK → offer_pages |
| vendor_id | UUID | No | - | FK → vendors |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| offer_type | TEXT | No | - | - |
| base_price | DECIMAL(10, 2) | No | 0 | - |
| currency | TEXT | Yes | 'USD' | - |
| billing_period | TEXT | Yes | - | - |
| is_quote_mode | BOOLEAN | Yes | false | - |
| stripe_product_id | TEXT | Yes | - | - |
| stripe_price_id | TEXT | Yes | - | - |
| is_active | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## onboarding_steps

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| workspace_id | UUID | No | - | FK → vendor_workspaces |
| vendor_id | UUID | No | - | FK → vendors |
| title | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| step_order | INTEGER | No | 0 | - |
| is_completed | BOOLEAN | Yes | false | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| completed_by | UUID | Yes | - | FK → auth |
| requires_file_upload | BOOLEAN | Yes | false | - |
| requires_form_submission | BOOLEAN | Yes | false | - |
| linked_form_id | UUID | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## outline_options

Stores multiple outline options generated by the AI for comparison and selection

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | No | - | FK → blog_posts |
| option_number | INTEGER | No | - | - |
| outline_data | JSONB | No | - | - |
| total_estimated_words | INTEGER | Yes | - | - |
| generated_at | TIMESTAMPTZ | Yes | now() | - |
| is_selected | BOOLEAN | Yes | false | - |
| created_at | TIMESTAMPTZ | Yes | now() | - |
| updated_at | TIMESTAMPTZ | Yes | now() | - |

---

## payment_links

One-time payment links for ad-hoc work

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → auth |
| client_id | UUID | Yes | - | FK → clients |
| stripe_payment_link_id | TEXT | No | - | UNIQUE |
| stripe_price_id | TEXT | No | - | - |
| amount | INTEGER | No | - | - |
| currency | TEXT | Yes | 'usd' | - |
| description | TEXT | Yes | - | - |
| url | TEXT | No | - | - |
| is_active | BOOLEAN | Yes | TRUE | - |
| expires_at | TIMESTAMPTZ | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## person

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| created_at | TIMESTAMP | Yes | NOW() | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| email | TEXT | Yes | - | UNIQUE |
| phone | TEXT | Yes | - | - |
| name | TEXT | Yes | - | - |
| company | TEXT | Yes | - | - |
| role | TEXT | Yes | - | - |
| avatar_url | TEXT | Yes | - | - |
| first_seen_at | TIMESTAMP | Yes | - | - |
| last_seen_at | TIMESTAMP | Yes | - | - |
| active_days | INTEGER | Yes | 0 | - |
| total_sessions | INTEGER | Yes | 0 | - |
| engagement_score | INTEGER | Yes | 0 | - |
| lifecycle_stage | TEXT | Yes | 'visitor' | - |
| source | TEXT | Yes | - | - |
| utm_source | TEXT | Yes | - | - |
| utm_medium | TEXT | Yes | - | - |
| utm_campaign | TEXT | Yes | - | - |
| utm_term | TEXT | Yes | - | - |
| utm_content | TEXT | Yes | - | - |
| referrer | TEXT | Yes | - | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## person_features

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| person_id | UUID | Yes | - | PRIMARY KEY, FK → person |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| total_page_views | INTEGER | Yes | 0 | - |
| total_sessions | INTEGER | Yes | 0 | - |
| active_days | INTEGER | Yes | 0 | - |
| avg_session_duration_seconds | INTEGER | Yes | - | - |
| demo_requested | BOOLEAN | Yes | FALSE | - |
| signup_completed | BOOLEAN | Yes | FALSE | - |
| first_client_added | BOOLEAN | Yes | FALSE | - |
| blog_created | BOOLEAN | Yes | FALSE | - |
| blog_approved | BOOLEAN | Yes | FALSE | - |
| blog_published | BOOLEAN | Yes | FALSE | - |
| purchase_completed | BOOLEAN | Yes | FALSE | - |
| clients_added_count | INTEGER | Yes | 0 | - |
| blogs_created_count | INTEGER | Yes | 0 | - |
| blogs_published_count | INTEGER | Yes | 0 | - |
| emails_sent | INTEGER | Yes | 0 | - |
| emails_opened | INTEGER | Yes | 0 | - |
| emails_clicked | INTEGER | Yes | 0 | - |
| email_open_rate | NUMERIC(5,2) | Yes | - | - |
| email_click_rate | NUMERIC(5,2) | Yes | - | - |
| last_page_view_at | TIMESTAMP | Yes | - | - |
| last_email_opened_at | TIMESTAMP | Yes | - | - |
| last_email_clicked_at | TIMESTAMP | Yes | - | - |
| engagement_score | INTEGER | Yes | 0 | - |
| conversion_probability | NUMERIC(5,2) | Yes | - | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## pipeline_jobs

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → vendors |
| client_id | UUID | Yes | - | FK → clients |
| website_url | TEXT | No | - | - |
| target_market | TEXT | Yes | - | - |
| client_goals | TEXT | Yes | - | - |
| ideal_customer_profile | TEXT | Yes | - | - |
| status | TEXT | No | 'pending' CHECK (status IN ('pending' | - |
| current_step | TEXT | Yes | - | - |
| progress | INTEGER | Yes | 0 | - |
| crawl_result | JSONB | Yes | - | - |
| analyze_result | JSONB | Yes | - | - |
| gaps_result | JSONB | Yes | - | - |
| topics_result | JSONB | Yes | - | - |
| seo_score | INTEGER | Yes | - | - |
| pages_indexed | INTEGER | Yes | - | - |
| content_gaps | INTEGER | Yes | - | - |
| topics_generated | INTEGER | Yes | - | - |
| blogs_created | INTEGER | Yes | 0 | - |
| error_message | TEXT | Yes | - | - |
| error_step | TEXT | Yes | - | - |
| started_at | TIMESTAMPTZ | Yes | - | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## post_requirements

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | Yes | - | FK → blog_posts |
| brand_guide_id | UUID | Yes | - | FK → brand_guides |
| include_faqs | BOOLEAN | Yes | false | - |
| include_table | BOOLEAN | Yes | false | - |
| include_comparison | BOOLEAN | Yes | false | - |
| include_statistics | BOOLEAN | Yes | false | - |
| custom_requirements | JSONB | Yes | - | - |
| selected_products | JSONB | Yes | - | - |
| selected_faqs | JSONB | Yes | - | - |
| selected_tables | JSONB | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## products_services

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| brand_guide_id | UUID | Yes | - | FK → brand_guides |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| category | TEXT | Yes | - | - |
| key_features | JSONB | Yes | - | - |
| benefits | JSONB | Yes | - | - |
| pricing_info | TEXT | Yes | - | - |
| use_cases | JSONB | Yes | - | - |
| target_audience | TEXT | Yes | - | - |
| metadata | JSONB | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## profiles

User profiles with role-based access control

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | - | PRIMARY KEY, FK → auth |
| email | TEXT | No | - | UNIQUE |
| full_name | TEXT | Yes | - | - |
| avatar_url | TEXT | Yes | - | - |
| role | TEXT | No | 'client' CHECK (role IN ('client' | - |
| client_id | UUID | Yes | - | - |
| created_at | TIMESTAMP | Yes | NOW() | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| company | TEXT | Yes | - | - |

---

## publish_queue

Queue system for scheduled and batch publishing to WordPress/CMS

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | No | - | FK → blog_posts |
| content_batch_id | UUID | Yes | - | FK → content_batches |
| client_id | UUID | No | - | FK → clients |
| cms_connection_id | UUID | Yes | - | FK → cms_connections |
| website_url | TEXT | No | - | - |
| publish_status | TEXT | Yes | 'publish' | - |
| scheduled_for | TIMESTAMPTZ | No | - | - |
| priority | INT | Yes | 5 CHECK (priority BETWEEN 1 AND 10) | - |
| status | TEXT | Yes | 'pending' | - |
| attempts | INT | Yes | 0 | - |
| max_attempts | INT | Yes | 3 | - |
| last_attempt_at | TIMESTAMPTZ | Yes | - | - |
| next_retry_at | TIMESTAMPTZ | Yes | - | - |
| wordpress_post_id | TEXT | Yes | - | - |
| published_url | TEXT | Yes | - | - |
| error_message | TEXT | Yes | - | - |
| error_details | JSONB | Yes | - | - |
| queued_by | UUID | Yes | - | FK → auth |
| queued_at | TIMESTAMPTZ | Yes | NOW() | - |
| started_at | TIMESTAMPTZ | Yes | - | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| options | JSONB | Yes | '{}' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## push_subscriptions

Stores browser push notification subscriptions for PWA

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | No | - | FK → auth |
| endpoint | TEXT | No | - | - |
| p256dh_key | TEXT | No | - | - |
| auth_key | TEXT | No | - | - |
| device_info | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| last_used_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## referral_clicks

Click tracking for referral links

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| referral_code_id | UUID | Yes | - | FK → referral_codes |
| ip_hash | TEXT | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| landing_page | TEXT | Yes | - | - |
| referrer_url | TEXT | Yes | - | - |
| utm_source | TEXT | Yes | - | - |
| utm_medium | TEXT | Yes | - | - |
| utm_campaign | TEXT | Yes | - | - |
| converted | BOOLEAN | Yes | false | - |
| converted_at | TIMESTAMPTZ | Yes | - | - |
| referral_id | UUID | Yes | - | FK → referrals |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## referral_codes

Unique referral codes/links for tracking

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| program_id | UUID | Yes | - | FK → referral_programs |
| vendor_id | UUID | Yes | - | FK → vendors |
| client_id | UUID | Yes | - | FK → vendor_clients |
| affiliate_id | UUID | Yes | - | FK → affiliates |
| code | TEXT | No | - | UNIQUE |
| custom_slug | TEXT | Yes | - | UNIQUE |
| clicks | INTEGER | Yes | 0 | - |
| signups | INTEGER | Yes | 0 | - |
| conversions | INTEGER | Yes | 0 | - |
| is_active | BOOLEAN | Yes | true | - |
| expires_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## referral_commissions

Commission earnings from referrals

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| referral_id | UUID | Yes | - | FK → referrals |
| referral_code_id | UUID | Yes | - | FK → referral_codes |
| referrer_vendor_id | UUID | Yes | - | FK → vendors |
| referrer_affiliate_id | UUID | Yes | - | FK → affiliates |
| source_type | TEXT | No | - | - |
| source_id | UUID | No | - | - |
| source_amount | DECIMAL(10,2) | No | - | - |
| commission_rate | DECIMAL(5,2) | No | - | - |
| commission_amount | DECIMAL(10,2) | No | - | - |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| payout_id | UUID | Yes | - | FK → referral_payouts |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## referral_payouts

Payout records to referrers

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → vendors |
| affiliate_id | UUID | Yes | - | FK → affiliates |
| amount | DECIMAL(10,2) | No | - | - |
| currency | TEXT | Yes | 'USD' | - |
| payout_method | TEXT | No | - | - |
| payout_details | JSONB | Yes | - | - |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| processed_at | TIMESTAMPTZ | Yes | - | - |
| external_reference | TEXT | Yes | - | - |
| notes | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## referral_programs

Configuration for different referral program types

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| program_type | TEXT | No | - | - |
| name | TEXT | No | - | - |
| commission_type | TEXT | No | 'percentage' CHECK (commission_type IN ('percentage' | - |
| commission_value | DECIMAL(10,2) | No | - | - |
| commission_duration_months | INTEGER | Yes | - | - |
| minimum_payout | DECIMAL(10,2) | Yes | 50.00 CHECK (minimum_payout >= 0) | - |
| payout_schedule | TEXT | Yes | 'monthly' CHECK (payout_schedule IN ('weekly' | - |
| is_active | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## referrals

Tracks individual referral relationships

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| referral_code_id | UUID | Yes | - | FK → referral_codes |
| program_id | UUID | Yes | - | FK → referral_programs |
| referrer_vendor_id | UUID | Yes | - | FK → vendors |
| referrer_client_id | UUID | Yes | - | FK → vendor_clients |
| referrer_affiliate_id | UUID | Yes | - | FK → affiliates |
| referred_vendor_id | UUID | Yes | - | FK → vendors |
| referred_client_id | UUID | Yes | - | FK → vendor_clients |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| qualified_at | TIMESTAMPTZ | Yes | - | - |
| landing_page | TEXT | Yes | - | - |
| utm_source | TEXT | Yes | - | - |
| utm_medium | TEXT | Yes | - | - |
| utm_campaign | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## review_sla_tracking

Tracks SLA compliance for each review cycle

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | No | - | FK → blog_posts |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | Yes | - | FK → clients |
| sla_type | TEXT | No | - | - |
| submitted_at | TIMESTAMPTZ | No | - | - |
| sla_deadline_at | TIMESTAMPTZ | No | - | - |
| alert_threshold_at | TIMESTAMPTZ | No | - | - |
| alert_sent_at | TIMESTAMPTZ | Yes | - | - |
| escalation_sent_at | TIMESTAMPTZ | Yes | - | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| review_duration_hours | NUMERIC(10, 2) | Yes | - | - |
| breached | BOOLEAN | Yes | false | - |
| metadata | JSONB | Yes | '{}'::JSONB | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## review_tasks

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| blog_post_id | uuid | Yes | - | FK → blog_posts |
| section_id | uuid | Yes | - | FK → blog_post_sections |
| status | text | Yes | 'pending' | - |
| description | text | No | - | - |
| assigned_to | uuid | Yes | - | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## revision_requests

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | Yes | - | FK → blog_posts |
| batch_id | UUID | Yes | - | FK → content_batches |
| requested_by | UUID | No | - | FK → profiles |
| comment | TEXT | No | - | - |
| specific_changes | JSONB | Yes | '[]' | - |
| status | TEXT | Yes | 'open' CHECK (status IN ('open' | - |
| addressed_at | TIMESTAMPTZ | Yes | - | - |
| addressed_by | UUID | Yes | - | FK → profiles |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## scheduled_pipeline_runs

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → vendors |
| client_id | UUID | Yes | - | FK → clients |
| name | TEXT | No | - | - |
| website_url | TEXT | No | - | - |
| target_market | TEXT | Yes | - | - |
| client_goals | TEXT | Yes | - | - |
| ideal_customer_profile | TEXT | Yes | - | - |
| frequency | TEXT | No | - | - |
| day_of_week | INTEGER | Yes | - | - |
| day_of_month | INTEGER | Yes | - | - |
| time_of_day | TIME | Yes | '09:00:00' | - |
| is_active | BOOLEAN | Yes | true | - |
| last_run_at | TIMESTAMPTZ | Yes | - | - |
| next_run_at | TIMESTAMPTZ | Yes | - | - |
| last_job_id | UUID | Yes | - | FK → pipeline_jobs |
| total_runs | INTEGER | Yes | 0 | - |
| successful_runs | INTEGER | Yes | 0 | - |
| failed_runs | INTEGER | Yes | 0 | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## scheduled_report_executions

Tracks execution history and status of scheduled reports

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| scheduled_report_id | UUID | Yes | - | FK → scheduled_reports |
| report_id | UUID | Yes | - | FK → reports |
| execution_status | TEXT | No | - | - |
| started_at | TIMESTAMPTZ | Yes | NOW() | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| error_message | TEXT | Yes | - | - |
| period_start | TIMESTAMPTZ | No | - | - |
| period_end | TIMESTAMPTZ | No | - | - |
| emails_sent_to | TEXT | Yes | - | - |
| email_sent_at | TIMESTAMPTZ | Yes | - | - |
| email_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## scheduled_reports

Stores recurring report schedules for automated generation and delivery

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → auth |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| website_id | UUID | Yes | - | FK → websites |
| content_batch_id | UUID | Yes | - | FK → content_batches |
| report_type | TEXT | No | - | - |
| frequency | TEXT | No | - | - |
| day_of_week | INTEGER | Yes | - | - |
| day_of_month | INTEGER | Yes | - | - |
| quarter_month | INTEGER | Yes | - | - |
| period_length | INTEGER | No | 30 | - |
| period_unit | TEXT | No | 'days' CHECK (period_unit IN ('days' | - |
| recipient_emails | TEXT | No | - | - |
| include_pdf_attachment | BOOLEAN | Yes | false | - |
| is_active | BOOLEAN | Yes | true | - |
| last_run_at | TIMESTAMPTZ | Yes | - | - |
| next_run_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## scraped_pages

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | Yes | - | FK → websites |
| url | TEXT | No | - | - |
| title | TEXT | Yes | - | - |
| description | TEXT | Yes | - | - |
| content | TEXT | Yes | - | - |
| html | TEXT | Yes | - | - |
| word_count | INTEGER | Yes | - | - |
| headings | JSONB | Yes | - | - |
| links | JSONB | Yes | - | - |
| images | JSONB | Yes | - | - |
| metadata | JSONB | Yes | - | - |
| scraped_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## segment

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| created_at | TIMESTAMP | Yes | NOW() | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| name | TEXT | No | - | - |
| slug | TEXT | No | - | UNIQUE |
| description | TEXT | Yes | - | - |
| criteria | JSONB | No | - | - |
| trigger_email_campaign | TEXT | Yes | - | - |
| trigger_webhook_url | TEXT | Yes | - | - |
| member_count | INTEGER | Yes | 0 | - |
| created_by | UUID | Yes | - | FK → auth |
| is_system | BOOLEAN | Yes | FALSE | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## segment_membership

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| segment_id | UUID | No | - | FK → segment |
| person_id | UUID | No | - | FK → person |
| entered_at | TIMESTAMP | Yes | NOW() | - |
| exited_at | TIMESTAMP | Yes | - | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## stripe_accounts

Vendor Stripe Connect accounts for receiving payments

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → auth |
| stripe_account_id | TEXT | No | - | UNIQUE |
| stripe_customer_id | TEXT | Yes | - | - |
| is_connected | BOOLEAN | Yes | FALSE | - |
| livemode | BOOLEAN | Yes | FALSE | - |
| account_type | TEXT | Yes | 'standard' | - |
| charges_enabled | BOOLEAN | Yes | FALSE | - |
| payouts_enabled | BOOLEAN | Yes | FALSE | - |
| details_submitted | BOOLEAN | Yes | FALSE | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## stripe_webhook_events

Audit trail of Stripe webhook events

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| stripe_event_id | TEXT | No | - | UNIQUE |
| event_type | TEXT | No | - | - |
| event_data | JSONB | No | - | - |
| processed | BOOLEAN | Yes | FALSE | - |
| processed_at | TIMESTAMPTZ | Yes | - | - |
| error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## subscription

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| person_id | UUID | Yes | - | FK → person |
| created_at | TIMESTAMP | Yes | NOW() | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |
| stripe_subscription_id | TEXT | No | - | UNIQUE |
| stripe_customer_id | TEXT | No | - | - |
| status | TEXT | No | - | - |
| plan_id | TEXT | Yes | - | - |
| plan_name | TEXT | Yes | - | - |
| billing_interval | TEXT | Yes | - | - |
| amount | INTEGER | Yes | - | - |
| currency | TEXT | Yes | 'usd' | - |
| mrr | INTEGER | Yes | - | - |
| current_period_start | TIMESTAMP | Yes | - | - |
| current_period_end | TIMESTAMP | Yes | - | - |
| trial_end | TIMESTAMP | Yes | - | - |
| canceled_at | TIMESTAMP | Yes | - | - |
| ended_at | TIMESTAMP | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| tenant_id | UUID | Yes | - | FK → auth |

---

## subscription_plans

Subscription plan templates created by vendors

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → auth |
| stripe_price_id | TEXT | No | - | - |
| stripe_product_id | TEXT | No | - | - |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| amount | INTEGER | No | - | - |
| currency | TEXT | Yes | 'usd' | - |
| interval | TEXT | No | - | - |
| interval_count | INTEGER | Yes | 1 | - |
| is_active | BOOLEAN | Yes | TRUE | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## subscriptions

Active subscriptions linking clients to plans

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| client_id | UUID | No | - | FK → clients |
| subscription_plan_id | UUID | Yes | - | FK → subscription_plans |
| stripe_subscription_id | TEXT | No | - | UNIQUE |
| stripe_customer_id | TEXT | No | - | - |
| status | TEXT | No | - | - |
| current_period_start | TIMESTAMPTZ | Yes | - | - |
| current_period_end | TIMESTAMPTZ | Yes | - | - |
| cancel_at_period_end | BOOLEAN | Yes | FALSE | - |
| canceled_at | TIMESTAMPTZ | Yes | - | - |
| trial_start | TIMESTAMPTZ | Yes | - | - |
| trial_end | TIMESTAMPTZ | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## task_attachments

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| task_id | uuid | No | - | FK → tasks |
| file_name | text | No | - | - |
| file_url | text | No | - | - |
| file_size | integer | Yes | - | - |
| mime_type | text | Yes | - | - |
| uploaded_by | uuid | No | - | - |
| created_at | timestamptz | Yes | now() | - |

---

## task_comments

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| task_id | uuid | No | - | FK → tasks |
| user_id | uuid | No | - | - |
| user_type | text | No | - | - |
| content | text | No | - | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## tasks

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| vendor_id | uuid | No | - | FK → vendors |
| workspace_id | uuid | Yes | - | FK → workspaces |
| title | text | No | - | - |
| description | text | Yes | - | - |
| status | task_status | No | 'todo' | - |
| priority | task_priority | No | 'medium' | - |
| assigned_to | uuid | Yes | - | - |
| assigned_by | uuid | Yes | - | - |
| blog_post_id | uuid | Yes | - | FK → blog_posts |
| client_id | uuid | Yes | - | FK → clients |
| due_date | timestamptz | Yes | - | - |
| started_at | timestamptz | Yes | - | - |
| completed_at | timestamptz | Yes | - | - |
| tags | text | Yes | - | - |
| created_at | timestamptz | Yes | now() | - |
| updated_at | timestamptz | Yes | now() | - |

---

## transactional_email_templates

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| template_key | TEXT | No | - | UNIQUE |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| subject_template | TEXT | No | - | - |
| html_content | TEXT | No | - | - |
| text_content | TEXT | Yes | - | - |
| variables | JSONB | Yes | '[]'::JSONB | - |
| is_system_template | BOOLEAN | Yes | TRUE | - |
| is_active | BOOLEAN | Yes | TRUE | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## uploaded_documents

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| filename | TEXT | No | - | - |
| file_type | TEXT | Yes | - | - |
| file_size | INTEGER | Yes | - | - |
| storage_path | TEXT | Yes | - | - |
| extracted_text | TEXT | Yes | - | - |
| analysis_result | JSONB | Yes | - | - |
| processed | BOOLEAN | Yes | false | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## user_2fa_audit_log

Audit log for all 2FA-related events

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | No | - | FK → auth |
| event_type | TEXT | No | - | - |
| ip_address | TEXT | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |

---

## user_2fa_backup_codes

Stores hashed backup codes for 2FA recovery

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | No | - | FK → auth |
| code_hash | TEXT | No | - | - |
| used | BOOLEAN | No | FALSE NOT NULL | - |
| used_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |

---

## user_2fa_settings

Stores 2FA configuration and status for each user

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| user_id | UUID | No | - | UNIQUE, FK → auth |
| enabled | BOOLEAN | No | FALSE NOT NULL | - |
| enforced | BOOLEAN | No | FALSE NOT NULL | - |
| totp_secret | TEXT | Yes | - | - |
| totp_verified | BOOLEAN | No | FALSE NOT NULL | - |
| backup_codes_generated_at | TIMESTAMPTZ | Yes | - | - |
| backup_codes_count | INTEGER | Yes | 0 | - |
| enabled_at | TIMESTAMPTZ | Yes | - | - |
| last_used_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |
| updated_at | TIMESTAMPTZ | No | NOW() NOT NULL | - |

---

## vendor_attribution

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| session_id | TEXT | No | - | UNIQUE |
| vendor_id | UUID | Yes | - | FK → vendors |
| first_page_id | UUID | Yes | - | FK → offer_pages |
| first_utm_source | TEXT | Yes | - | - |
| first_utm_medium | TEXT | Yes | - | - |
| first_utm_campaign | TEXT | Yes | - | - |
| first_utm_content | TEXT | Yes | - | - |
| first_utm_term | TEXT | Yes | - | - |
| first_referrer | TEXT | Yes | - | - |
| last_page_id | UUID | Yes | - | FK → offer_pages |
| last_utm_source | TEXT | Yes | - | - |
| last_utm_medium | TEXT | Yes | - | - |
| last_utm_campaign | TEXT | Yes | - | - |
| last_utm_content | TEXT | Yes | - | - |
| last_utm_term | TEXT | Yes | - | - |
| last_referrer | TEXT | Yes | - | - |
| converted | BOOLEAN | Yes | false | - |
| converted_at | TIMESTAMPTZ | Yes | - | - |
| client_id | UUID | Yes | - | FK → vendor_clients |
| order_id | UUID | Yes | - | FK → vendor_orders |
| first_visit_at | TIMESTAMPTZ | Yes | NOW() | - |
| last_visit_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_availability

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| day_of_week | INTEGER | No | - | - |
| start_time | TIME | No | - | - |
| end_time | TIME | No | - | - |
| is_active | BOOLEAN | Yes | true | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_calendar_integrations

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| provider | TEXT | No | - | - |
| access_token | TEXT | No | - | - |
| refresh_token | TEXT | Yes | - | - |
| token_expires_at | TIMESTAMPTZ | Yes | - | - |
| calendar_id | TEXT | Yes | - | - |
| calendar_name | TEXT | Yes | - | - |
| is_active | BOOLEAN | Yes | true | - |
| last_sync_at | TIMESTAMPTZ | Yes | - | - |
| sync_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_client_engagement

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | No | - | FK → vendor_clients |
| workspace_id | UUID | Yes | - | FK → vendor_workspaces |
| week_start | DATE | No | - | - |
| portal_visits | INTEGER | Yes | 0 | - |
| messages_sent | INTEGER | Yes | 0 | - |
| forms_submitted | INTEGER | Yes | 0 | - |
| deliverables_viewed | INTEGER | Yes | 0 | - |
| engagement_score | INTEGER | Yes | 0 | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_clients

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| user_id | UUID | Yes | - | FK → auth |
| email | TEXT | No | - | - |
| full_name | TEXT | Yes | - | - |
| phone | TEXT | Yes | - | - |
| first_page_id | UUID | Yes | - | FK → offer_pages |
| utm_source | TEXT | Yes | - | - |
| utm_medium | TEXT | Yes | - | - |
| utm_campaign | TEXT | Yes | - | - |
| status | TEXT | Yes | 'lead' CHECK (status IN ('lead' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_daily_rollups

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| date | DATE | No | - | - |
| page_views | INTEGER | Yes | 0 | - |
| avg_time_on_page | INTEGER | Yes | 0 | - |
| avg_scroll_depth | INTEGER | Yes | 0 | - |
| cta_clicks | INTEGER | Yes | 0 | - |
| cta_click_rate | DECIMAL(5, 2) | Yes | 0 | - |
| call_bookings | INTEGER | Yes | 0 | - |
| revenue | DECIMAL(10, 2) | Yes | 0 | - |
| currency | TEXT | Yes | 'USD' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_deliverables

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| workspace_id | UUID | No | - | FK → vendor_workspaces |
| vendor_id | UUID | No | - | FK → vendors |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| deliverable_type | TEXT | No | - | - |
| file_url | TEXT | Yes | - | - |
| file_size | BIGINT | Yes | - | - |
| file_type | TEXT | Yes | - | - |
| status | TEXT | Yes | 'draft' CHECK (status IN ('draft' | - |
| delivered_at | TIMESTAMPTZ | Yes | - | - |
| approved_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_event_log

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| event_name | TEXT | No | - | - |
| event_type | TEXT | No | - | - |
| vendor_id | UUID | Yes | - | FK → vendors |
| page_id | UUID | Yes | - | FK → offer_pages |
| client_id | UUID | Yes | - | FK → vendor_clients |
| workspace_id | UUID | Yes | - | FK → vendor_workspaces |
| session_id | TEXT | Yes | - | - |
| user_id | UUID | Yes | - | FK → auth |
| user_type | TEXT | Yes | - | - |
| properties | JSONB | Yes | '{}'::jsonb | - |
| utm_source | TEXT | Yes | - | - |
| utm_medium | TEXT | Yes | - | - |
| utm_campaign | TEXT | Yes | - | - |
| utm_content | TEXT | Yes | - | - |
| utm_term | TEXT | Yes | - | - |
| referrer | TEXT | Yes | - | - |
| user_agent | TEXT | Yes | - | - |
| ip_address | INET | Yes | - | - |
| device_type | TEXT | Yes | - | - |
| browser | TEXT | Yes | - | - |
| os | TEXT | Yes | - | - |
| country | TEXT | Yes | - | - |
| city | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_form_submissions

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| form_id | UUID | No | - | FK → vendor_forms |
| workspace_id | UUID | No | - | FK → vendor_workspaces |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | No | - | FK → vendor_clients |
| responses | JSONB | No | '{}'::jsonb | - |
| is_reviewed | BOOLEAN | Yes | false | - |
| reviewed_at | TIMESTAMPTZ | Yes | - | - |
| reviewed_by | UUID | Yes | - | FK → auth |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_forms

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| fields | JSONB | No | '[]'::jsonb | - |
| is_template | BOOLEAN | Yes | false | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_funnel_stats

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| page_id | UUID | Yes | - | FK → offer_pages |
| session_id | TEXT | No | - | - |
| viewed_page | BOOLEAN | Yes | false | - |
| scrolled_50 | BOOLEAN | Yes | false | - |
| played_vsl | BOOLEAN | Yes | false | - |
| clicked_cta | BOOLEAN | Yes | false | - |
| started_checkout | BOOLEAN | Yes | false | - |
| completed_checkout | BOOLEAN | Yes | false | - |
| viewed_page_at | TIMESTAMPTZ | Yes | - | - |
| scrolled_50_at | TIMESTAMPTZ | Yes | - | - |
| played_vsl_at | TIMESTAMPTZ | Yes | - | - |
| clicked_cta_at | TIMESTAMPTZ | Yes | - | - |
| started_checkout_at | TIMESTAMPTZ | Yes | - | - |
| completed_checkout_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_meeting_types

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| duration_minutes | INTEGER | No | 30 | - |
| buffer_before_minutes | INTEGER | Yes | 0 | - |
| buffer_after_minutes | INTEGER | Yes | 0 | - |
| location_type | TEXT | No | - | - |
| location_details | TEXT | Yes | - | - |
| is_paid | BOOLEAN | Yes | false | - |
| price | DECIMAL(10, 2) | Yes | 0 | - |
| currency | TEXT | Yes | 'USD' | - |
| is_active | BOOLEAN | Yes | true | - |
| color | TEXT | Yes | '#3B82F6' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_meetings

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | Yes | - | FK → vendor_clients |
| workspace_id | UUID | Yes | - | FK → vendor_workspaces |
| meeting_type_id | UUID | No | - | FK → vendor_meeting_types |
| title | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| start_time | TIMESTAMPTZ | No | - | - |
| end_time | TIMESTAMPTZ | No | - | - |
| timezone | TEXT | No | - | - |
| location_type | TEXT | No | - | - |
| location_details | TEXT | Yes | - | - |
| meeting_link | TEXT | Yes | - | - |
| vendor_user_id | UUID | Yes | - | FK → auth |
| client_user_id | UUID | Yes | - | FK → auth |
| client_email | TEXT | No | - | - |
| client_name | TEXT | Yes | - | - |
| status | TEXT | Yes | 'scheduled' CHECK (status IN ('scheduled' | - |
| google_calendar_event_id | TEXT | Yes | - | - |
| notes | TEXT | Yes | - | - |
| cancelled_at | TIMESTAMPTZ | Yes | - | - |
| cancellation_reason | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_members

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| user_id | UUID | No | - | FK → auth |
| role | TEXT | No | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_messages

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| workspace_id | UUID | No | - | FK → vendor_workspaces |
| vendor_id | UUID | No | - | FK → vendors |
| sender_id | UUID | No | - | FK → auth |
| sender_type | TEXT | No | - | - |
| content | TEXT | No | - | - |
| attachments | JSONB | Yes | '[]'::jsonb | - |
| is_read | BOOLEAN | Yes | false | - |
| read_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_order_items

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| order_id | UUID | No | - | FK → vendor_orders |
| item_type | TEXT | No | - | - |
| offer_id | UUID | Yes | - | FK → offers |
| addon_id | UUID | Yes | - | FK → offer_addons |
| name | TEXT | No | - | - |
| description | TEXT | Yes | - | - |
| unit_price | DECIMAL(10, 2) | No | - | - |
| quantity | INTEGER | Yes | 1 | - |
| total_price | DECIMAL(10, 2) | No | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_orders

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | No | - | FK → vendor_clients |
| workspace_id | UUID | Yes | - | FK → vendor_workspaces |
| offer_id | UUID | No | - | FK → offers |
| order_number | TEXT | No | - | UNIQUE |
| base_amount | DECIMAL(10, 2) | No | - | - |
| addons_amount | DECIMAL(10, 2) | Yes | 0 | - |
| total_amount | DECIMAL(10, 2) | No | - | - |
| currency | TEXT | Yes | 'USD' | - |
| payment_method | TEXT | Yes | - | - |
| payment_status | TEXT | Yes | 'pending' CHECK (payment_status IN ('pending' | - |
| stripe_checkout_session_id | TEXT | Yes | - | - |
| stripe_payment_intent_id | TEXT | Yes | - | - |
| stripe_customer_id | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| paid_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_page_daily_rollups

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| page_id | UUID | No | - | FK → offer_pages |
| date | DATE | No | - | - |
| page_views | INTEGER | Yes | 0 | - |
| avg_time_on_page | INTEGER | Yes | 0 | - |
| avg_scroll_depth | INTEGER | Yes | 0 | - |
| vsl_plays | INTEGER | Yes | 0 | - |
| vsl_completion_rate | DECIMAL(5, 2) | Yes | 0 | - |
| cta_clicks | INTEGER | Yes | 0 | - |
| cta_click_rate | DECIMAL(5, 2) | Yes | 0 | - |
| call_bookings | INTEGER | Yes | 0 | - |
| revenue | DECIMAL(10, 2) | Yes | 0 | - |
| currency | TEXT | Yes | 'USD' | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_revisions

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| workspace_id | UUID | No | - | FK → vendor_workspaces |
| vendor_id | UUID | No | - | FK → vendors |
| deliverable_id | UUID | Yes | - | FK → vendor_deliverables |
| title | TEXT | No | - | - |
| description | TEXT | No | - | - |
| requested_by | UUID | No | - | FK → auth |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| resolution_notes | TEXT | Yes | - | - |
| resolved_by | UUID | Yes | - | FK → auth |
| resolved_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_sla_settings

SLA configuration per vendor for editor and client reviews

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | UNIQUE, FK → vendors |
| editor_sla_hours | INTEGER | Yes | 24 | - |
| editor_alert_threshold_hours | INTEGER | Yes | 20 | - |
| client_sla_hours | INTEGER | Yes | 72 | - |
| client_alert_threshold_hours | INTEGER | Yes | 60 | - |
| enable_alerts | BOOLEAN | Yes | true | - |
| alert_recipients | JSONB | Yes | '[]'::JSONB | - |
| escalation_enabled | BOOLEAN | Yes | false | - |
| escalation_hours | INTEGER | Yes | 48 | - |
| escalation_recipients | JSONB | Yes | '[]'::JSONB | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_subscriptions

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | No | - | FK → vendor_clients |
| workspace_id | UUID | Yes | - | FK → vendor_workspaces |
| offer_id | UUID | No | - | FK → offers |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| amount | DECIMAL(10, 2) | No | - | - |
| currency | TEXT | Yes | 'USD' | - |
| billing_period | TEXT | No | - | - |
| stripe_subscription_id | TEXT | Yes | - | UNIQUE |
| stripe_customer_id | TEXT | Yes | - | - |
| current_period_start | TIMESTAMPTZ | Yes | - | - |
| current_period_end | TIMESTAMPTZ | Yes | - | - |
| cancel_at | TIMESTAMPTZ | Yes | - | - |
| cancelled_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_team_invitations

Invitations for team members to join a vendor organization

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() PRIMARY KEY | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| email | TEXT | No | - | - |
| role | TEXT | No | - | - |
| invited_by | UUID | Yes | - | FK → auth |
| token | TEXT | No | - | UNIQUE |
| expires_at | TIMESTAMPTZ | No | (NOW() + INTERVAL '7 days') | - |
| status | TEXT | Yes | 'pending' CHECK (status IN ('pending' | - |
| accepted_at | TIMESTAMPTZ | Yes | - | - |
| accepted_by | UUID | Yes | - | FK → auth |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendor_workspaces

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | No | - | FK → vendor_clients |
| offer_id | UUID | Yes | - | FK → offers |
| page_id | UUID | Yes | - | FK → offer_pages |
| name | TEXT | No | - | - |
| status | TEXT | Yes | 'onboarding' CHECK (status IN ('onboarding' | - |
| started_at | TIMESTAMPTZ | Yes | NOW() | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## vendors

Vendor organizations (agencies) that use BlogCanvas to manage client content

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| name | TEXT | No | - | - |
| slug | TEXT | No | - | UNIQUE |
| email | TEXT | No | - | UNIQUE |
| phone | TEXT | Yes | - | - |
| website | TEXT | Yes | - | - |
| logo_url | TEXT | Yes | - | - |
| brand_colors | JSONB | Yes | '{"primary": "#4F46E5" | - |
| company_type | TEXT | Yes | - | - |
| team_size | TEXT | Yes | - | - |
| industry_focus | JSONB | Yes | '[]' | - |
| default_timezone | TEXT | Yes | 'America/New_York' | - |
| notification_settings | JSONB | Yes | '{"email_enabled": true | - |
| billing_settings | JSONB | Yes | '{}' | - |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| onboarded_at | TIMESTAMPTZ | Yes | - | - |
| trial_ends_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_by | UUID | Yes | - | FK → auth |
| user_id | UUID | Yes | - | FK → auth |
| handle | TEXT | No | - | UNIQUE |
| business_name | TEXT | No | - | - |
| full_name | TEXT | Yes | - | - |
| avatar_url | TEXT | Yes | - | - |
| bio | TEXT | Yes | - | - |
| brand_color | TEXT | Yes | '#000000' | - |
| timezone | TEXT | Yes | 'UTC' | - |

---

## webhook_deliveries

Tracks individual webhook delivery attempts with retry logic

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| webhook_id | UUID | No | - | FK → webhooks |
| event | VARCHAR(100) | No | - | - |
| payload | JSONB | No | - | - |
| response_status | INTEGER | Yes | - | - |
| response_body | TEXT | Yes | - | - |
| response_headers | JSONB | Yes | - | - |
| error_message | TEXT | Yes | - | - |
| delivered_at | TIMESTAMPTZ | Yes | - | - |
| attempts | INTEGER | No | 0 | - |
| next_retry_at | TIMESTAMPTZ | Yes | - | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| status | VARCHAR(20) | No | 'pending' CHECK (status IN ('pending' | - |
| created_at | TIMESTAMPTZ | No | now() | - |

---

## webhook_events_log

Audit log of all webhook events triggered in the system

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| event | VARCHAR(100) | No | - | - |
| payload | JSONB | No | - | - |
| webhook_count | INTEGER | No | 0 | - |
| created_at | TIMESTAMPTZ | No | now() | - |

---

## webhooks

Vendor-configured webhook endpoints for receiving event notifications

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| name | VARCHAR(255) | No | - | - |
| url | TEXT | No | - | - |
| events | TEXT | No | '{}' | - |
| secret | TEXT | No | - | - |
| is_active | BOOLEAN | No | true | - |
| retry_count | INTEGER | No | 3 | - |
| retry_delay_seconds | INTEGER | No | 60 | - |
| timeout_seconds | INTEGER | No | 30 | - |
| headers | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | No | now() | - |
| updated_at | TIMESTAMPTZ | No | now() | - |
| created_by | UUID | Yes | - | FK → auth |
| last_triggered_at | TIMESTAMPTZ | Yes | - | - |

---

## website_insights

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | Yes | - | FK → websites |
| insight_type | TEXT | No | - | - |
| metric_name | TEXT | No | - | - |
| metric_value | JSONB | Yes | - | - |
| trend | TEXT | Yes | - | - |
| recommendations | JSONB | Yes | - | - |
| analyzed_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## website_pages

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | PRIMARY KEY |
| client_id | uuid | Yes | - | FK → clients |
| url | text | No | - | - |
| title | text | Yes | - | - |
| html | text | Yes | - | - |
| clean_text | text | Yes | - | - |
| crawl_job_id | uuid | Yes | - | - |
| created_at | timestamptz | Yes | now() | - |

---

## website_scans

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| website_id | UUID | No | - | FK → websites |
| scan_type | VARCHAR(50) | No | 'full' | - |
| status | VARCHAR(50) | No | 'pending' | - |
| url | TEXT | No | - | - |
| max_pages | INTEGER | Yes | 50 | - |
| max_depth | INTEGER | Yes | 3 | - |
| pages_scanned | INTEGER | Yes | 0 | - |
| text_content | JSONB | Yes | '[]'::jsonb | - |
| schema_markup | JSONB | Yes | '[]'::jsonb | - |
| images | JSONB | Yes | '[]'::jsonb | - |
| site_metadata | JSONB | Yes | '{}'::jsonb | - |
| internal_links | JSONB | Yes | '[]'::jsonb | - |
| external_links | JSONB | Yes | '[]'::jsonb | - |
| content_analysis | JSONB | Yes | '{}'::jsonb | - |
| seo_elements | JSONB | Yes | '{}'::jsonb | - |
| errors | JSONB | Yes | '[]'::jsonb | - |
| started_at | TIMESTAMPTZ | Yes | - | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## websites

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| url | TEXT | No | - | UNIQUE |
| domain | TEXT | No | - | - |
| title | TEXT | Yes | - | - |
| description | TEXT | Yes | - | - |
| scrape_status | TEXT | Yes | 'pending' | - |
| pages_scraped | INTEGER | Yes | 0 | - |
| total_pages_found | INTEGER | Yes | 0 | - |
| last_scraped_at | TIMESTAMPTZ | Yes | - | - |
| metadata | JSONB | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## wordpress_connections

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | Yes | - | FK → vendors |
| client_id | UUID | Yes | - | FK → clients |
| site_url | TEXT | No | - | - |
| site_name | TEXT | Yes | - | - |
| username | TEXT | No | - | - |
| application_password_encrypted | TEXT | No | - | - |
| is_active | BOOLEAN | Yes | true | - |
| last_connected_at | TIMESTAMPTZ | Yes | - | - |
| connection_status | TEXT | Yes | 'pending' | - |
| connection_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |
| created_by | UUID | Yes | - | FK → auth |

---

## wordpress_posts

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | No | - | FK → blog_posts |
| wordpress_site_id | UUID | No | - | FK → wordpress_sites |
| wordpress_post_id | INTEGER | No | - | - |
| wordpress_url | TEXT | Yes | - | - |
| wordpress_status | TEXT | Yes | - | - |
| published_at | TIMESTAMPTZ | Yes | NOW() | - |
| last_synced_at | TIMESTAMPTZ | Yes | - | - |
| metadata | JSONB | Yes | '{}' | - |

---

## wordpress_publish_log

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| blog_post_id | UUID | Yes | - | FK → blog_posts |
| wordpress_connection_id | UUID | Yes | - | FK → wordpress_connections |
| wp_post_id | INTEGER | Yes | - | - |
| wp_post_url | TEXT | Yes | - | - |
| wp_post_status | TEXT | Yes | - | - |
| published_at | TIMESTAMPTZ | Yes | - | - |
| scheduled_for | TIMESTAMPTZ | Yes | - | - |
| status | TEXT | Yes | 'pending' | - |
| error_message | TEXT | Yes | - | - |
| retry_count | INTEGER | Yes | 0 | - |
| content_hash | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## wordpress_sites

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | Yes | - | FK → clients |
| website_id | UUID | Yes | - | FK → websites |
| name | TEXT | No | - | - |
| site_url | TEXT | No | - | - |
| api_url | TEXT | Yes | - | - |
| api_username | TEXT | Yes | - | - |
| api_key_encrypted | TEXT | Yes | - | - |
| status | TEXT | Yes | 'active' CHECK (status IN ('active' | - |
| last_publish_at | TIMESTAMPTZ | Yes | - | - |
| last_error | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | NOW() | - |
| updated_at | TIMESTAMPTZ | Yes | NOW() | - |

---

## wordpress_taxonomy_cache

Caches WordPress categories and tags fetched from WordPress sites to avoid repeated API calls

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | gen_random_uuid() PRIMARY KEY | PRIMARY KEY |
| wordpress_connection_id | UUID | No | - | - |
| taxonomy_type | TEXT | No | - | - |
| taxonomy_id | INTEGER | No | - | - |
| name | TEXT | No | - | - |
| slug | TEXT | No | - | - |
| created_at | TIMESTAMP | Yes | NOW() | - |
| updated_at | TIMESTAMP | Yes | NOW() | - |

---

## work_declaration_updates

Tracks activity and updates on work declarations

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | uuid_generate_v4() | PRIMARY KEY |
| work_declaration_id | UUID | No | - | FK → work_declarations |
| created_by | UUID | No | - | FK → auth |
| update_type | TEXT | No | - | - |
| old_value | TEXT | Yes | - | - |
| new_value | TEXT | Yes | - | - |
| comment | TEXT | Yes | - | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| created_at | TIMESTAMPTZ | Yes | now() | - |

---

## work_declarations

Stores work items declared by vendors for client visibility and transparency

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | Yes | uuid_generate_v4() | PRIMARY KEY |
| vendor_id | UUID | No | - | FK → vendors |
| client_id | UUID | No | - | FK → clients |
| content_batch_id | UUID | Yes | - | FK → content_batches |
| created_by | UUID | No | - | FK → auth |
| title | TEXT | No | - | - |
| description | TEXT | No | - | - |
| type | TEXT | No | - | - |
| status | TEXT | No | 'planned' CHECK (status IN ('planned' | - |
| priority | TEXT | Yes | 'medium' CHECK (priority IN ('low' | - |
| start_date | DATE | Yes | - | - |
| due_date | DATE | Yes | - | - |
| completed_at | TIMESTAMPTZ | Yes | - | - |
| progress_percentage | INTEGER | Yes | 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100) | - |
| milestones | JSONB | Yes | '[]'::jsonb | - |
| deliverables | JSONB | Yes | '[]'::jsonb | - |
| metadata | JSONB | Yes | '{}'::jsonb | - |
| notes | TEXT | Yes | - | - |
| created_at | TIMESTAMPTZ | Yes | now() | - |
| updated_at | TIMESTAMPTZ | Yes | now() | - |

---

## Statistics

- **Total Tables:** 149
- **Total Columns:** 1975
- **Tables with Primary Key:** 149
- **Foreign Key Relations:** 298

### Column Type Distribution

- **text:** 636
- **uuid:** 465
- **timestamptz:** 360
- **jsonb:** 137
- **integer:** 125
- **boolean:** 107
- **timestamp:** 39
- **varchar:** 39
- **decimal:** 20
- **int:** 13
- **inet:** 7
- **numeric:** 6
- **date:** 6
- **bigint:** 5
- **time:** 3
- **in:** 2
- **blog_post_status:** 1
- **is:** 1
- **task_status:** 1
- **task_priority:** 1
- **activity_type:** 1
