-- Create user notifications table
CREATE TABLE public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'broadcast')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_table TEXT,
    related_id UUID,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications OR broadcast notifications
CREATE POLICY "Users can view own and broadcast notifications"
ON public.user_notifications
FOR SELECT
USING (
    auth.uid() = user_id 
    OR (type = 'broadcast' AND auth.uid() IS NOT NULL)
);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id OR type = 'broadcast');

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON public.user_notifications
FOR ALL
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX idx_user_notifications_type ON public.user_notifications(type);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;