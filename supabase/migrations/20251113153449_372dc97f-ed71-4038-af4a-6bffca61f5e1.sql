-- Create function to notify admins about new consultations
CREATE OR REPLACE FUNCTION public.notify_admins_new_consultation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for new consultation
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    related_id,
    related_table
  )
  VALUES (
    'استشارة جديدة بانتظار المراجعة',
    'استشارة جديدة من ' || NEW.full_name || ' - ' || NEW.consultation_preference,
    'consultation',
    NEW.id,
    'consultations'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins when new consultation is created
CREATE TRIGGER trigger_notify_admins_new_consultation
AFTER INSERT ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_consultation();