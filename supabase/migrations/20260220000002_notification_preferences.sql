-- Notification preferences table
-- Stores user preferences for email and in-app notifications

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Email notification preferences
  email_new_order boolean DEFAULT true,
  email_order_update boolean DEFAULT true,
  email_message boolean DEFAULT true,
  email_content_approved boolean DEFAULT true,
  email_content_rejected boolean DEFAULT true,
  email_meeting_reminder boolean DEFAULT true,
  email_weekly_summary boolean DEFAULT false,

  -- In-app notification preferences
  in_app_new_order boolean DEFAULT true,
  in_app_message boolean DEFAULT true,
  in_app_content_update boolean DEFAULT true,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  UNIQUE(user_id)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;

-- Add comment
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for email and in-app notifications';
