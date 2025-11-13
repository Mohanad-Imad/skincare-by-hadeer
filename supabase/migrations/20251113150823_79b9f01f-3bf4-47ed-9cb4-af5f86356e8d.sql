-- Create notifications table for admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id UUID,
  related_table TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create function to notify admins about new reviews
CREATE OR REPLACE FUNCTION public.notify_admins_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for new review
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    related_id,
    related_table
  )
  VALUES (
    'رأي جديد بانتظار المراجعة',
    'رأي جديد من ' || NEW.customer_name || ' بتقييم ' || NEW.rating || ' نجوم',
    'review',
    NEW.id,
    'customer_reviews'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins when new review is submitted
CREATE TRIGGER trigger_notify_admins_new_review
AFTER INSERT ON public.customer_reviews
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_admins_new_review();

-- Create index for better performance
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);