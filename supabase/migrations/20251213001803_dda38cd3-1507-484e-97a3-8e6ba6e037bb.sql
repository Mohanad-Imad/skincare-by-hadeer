-- Add link_url column to user_notifications table
ALTER TABLE public.user_notifications 
ADD COLUMN link_url text DEFAULT NULL;