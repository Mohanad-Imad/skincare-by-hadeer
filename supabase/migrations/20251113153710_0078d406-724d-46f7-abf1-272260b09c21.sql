-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  customer_name text NOT NULL,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (is_approved = true);

CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify admins about new product reviews
CREATE OR REPLACE FUNCTION public.notify_admins_new_product_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name text;
BEGIN
  -- Get product name
  SELECT name_ar INTO v_product_name
  FROM public.products
  WHERE id = NEW.product_id;

  -- Insert notification for new product review
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    related_id,
    related_table
  )
  VALUES (
    'تقييم منتج جديد بانتظار المراجعة',
    'تقييم جديد من ' || NEW.customer_name || ' للمنتج ' || COALESCE(v_product_name, 'غير معروف') || ' بتقييم ' || NEW.rating || ' نجوم',
    'product_review',
    NEW.id,
    'product_reviews'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins when new product review is created
CREATE TRIGGER trigger_notify_admins_new_product_review
AFTER INSERT ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_product_review();

-- Create index for better performance
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_approved ON public.product_reviews(is_approved);