-- Update the notify_admins_new_order function to use the correct currency
CREATE OR REPLACE FUNCTION public.notify_admins_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_currency TEXT;
BEGIN
  -- Get the currency from store_settings
  SELECT currency INTO v_currency FROM public.store_settings LIMIT 1;
  
  -- Default to د.ع if not found
  IF v_currency IS NULL THEN
    v_currency := 'د.ع';
  END IF;

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
    'طلب جديد من ' || NEW.customer_name || ' بقيمة ' || ROUND(NEW.total_amount) || ' ' || v_currency,
    'order',
    NEW.id,
    'orders'
  );
  
  RETURN NEW;
END;
$function$;