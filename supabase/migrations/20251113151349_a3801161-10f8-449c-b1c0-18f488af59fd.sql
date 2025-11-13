-- Create function to notify admins about new orders
CREATE OR REPLACE FUNCTION public.notify_admins_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for new order
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    related_id,
    related_table
  )
  VALUES (
    'طلب جديد',
    'طلب جديد من ' || NEW.customer_name || ' بقيمة ' || NEW.total_amount || ' ريال',
    'order',
    NEW.id,
    'orders'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins when new order is created
CREATE TRIGGER trigger_notify_admins_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_order();