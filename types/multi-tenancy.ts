export type UserRole = 'owner' | 'staff' | 'client';

export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: UserRole;
    client_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    name: string;
    slug: string;
    website_url?: string;
    contact_email?: string;
    status: 'onboarding' | 'active' | 'paused' | 'churned';

    // Brand profile
    product_service_summary?: string;
    target_audience?: string;
    positioning?: string;
    tone_of_voice?: {
        casual_to_formal: number; // 0-100
        playful_to_serious: number;
        direct_to_story: number;
    };
    brand_profile?: {
        preferred_phrases: string[];
        avoid_phrases: string[];
    };
    story_bank?: {
        title: string;
        summary: string;
        tags: string[];
    }[];

    // Settings
    notification_settings?: {
        notify_on_draft_ready: boolean;
        notify_before_publish: boolean;
        notify_hours_before: number;
        weekly_summary: boolean;
    };

    // CMS
    cms_type?: 'wordpress' | 'webflow' | 'contentful';
    cms_base_url?: string;
    cms_status: 'not_configured' | 'connected' | 'error';

    // Metadata
    onboarded_via?: 'site_scan' | 'manual_intake';
    onboarded_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: string;
    client_id: string;
    user_id?: string;
    blog_post_id?: string;
    action: string;
    details?: Record<string, any>;
    created_at: string;
}
