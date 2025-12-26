
-- Create loyalty_settings table for admin configuration
CREATE TABLE public.loyalty_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  points_per_currency NUMERIC NOT NULL DEFAULT 1, -- 1 point per 1000 IQD
  currency_per_point NUMERIC NOT NULL DEFAULT 1000, -- spending 1000 IQD = 1 point
  redemption_rate NUMERIC NOT NULL DEFAULT 10, -- 100 points = 1000 IQD (so 1 point = 10 IQD)
  min_redemption_points INTEGER NOT NULL DEFAULT 100, -- minimum points to redeem
  welcome_bonus INTEGER NOT NULL DEFAULT 0, -- bonus points for new users
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_settings
CREATE POLICY "Admins can manage loyalty settings" 
ON public.loyalty_settings 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active loyalty settings" 
ON public.loyalty_settings 
FOR SELECT 
USING (is_active = true);

-- Create user_points table to track user balances
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_points
CREATE POLICY "Users can view own points" 
ON public.user_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all points" 
ON public.user_points 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create points_transactions table for history
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'adjustment')),
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for points_transactions
CREATE POLICY "Users can view own transactions" 
ON public.points_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.points_transactions 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default loyalty settings
INSERT INTO public.loyalty_settings (
  is_active,
  points_per_currency,
  currency_per_point,
  redemption_rate,
  min_redemption_points,
  welcome_bonus
) VALUES (
  true,
  1,
  1000,
  10,
  100,
  0
);

-- Add points_used column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_discount NUMERIC DEFAULT 0;

-- Create function to calculate and add points after order completion
CREATE OR REPLACE FUNCTION public.award_order_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_points_to_award INTEGER;
  v_order_amount NUMERIC;
BEGIN
  -- Only award points when order status changes to 'delivered' and user_id is not null
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.user_id IS NOT NULL THEN
    -- Get loyalty settings
    SELECT * INTO v_settings FROM loyalty_settings WHERE is_active = true LIMIT 1;
    
    IF v_settings IS NOT NULL THEN
      -- Calculate points (total_amount / currency_per_point)
      v_order_amount := NEW.total_amount - COALESCE(NEW.points_discount, 0);
      v_points_to_award := FLOOR(v_order_amount / v_settings.currency_per_point);
      
      IF v_points_to_award > 0 THEN
        -- Insert or update user_points
        INSERT INTO user_points (user_id, total_points, total_earned)
        VALUES (NEW.user_id, v_points_to_award, v_points_to_award)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_points = user_points.total_points + v_points_to_award,
          total_earned = user_points.total_earned + v_points_to_award,
          updated_at = now();
        
        -- Record transaction
        INSERT INTO points_transactions (user_id, order_id, points, transaction_type, description_ar, description_en)
        VALUES (
          NEW.user_id, 
          NEW.id, 
          v_points_to_award, 
          'earned',
          'نقاط مكتسبة من طلب #' || LEFT(NEW.id::text, 8),
          'Points earned from order #' || LEFT(NEW.id::text, 8)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for awarding points
CREATE TRIGGER on_order_delivered
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_order_points();

-- Create function to redeem points
CREATE OR REPLACE FUNCTION public.redeem_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_user_points RECORD;
  v_discount_amount NUMERIC;
BEGIN
  -- Get loyalty settings
  SELECT * INTO v_settings FROM loyalty_settings WHERE is_active = true LIMIT 1;
  
  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'Loyalty program is not active';
  END IF;
  
  -- Check minimum points
  IF p_points < v_settings.min_redemption_points THEN
    RAISE EXCEPTION 'Minimum points required: %', v_settings.min_redemption_points;
  END IF;
  
  -- Get user points
  SELECT * INTO v_user_points FROM user_points WHERE user_id = p_user_id;
  
  IF v_user_points IS NULL OR v_user_points.total_points < p_points THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;
  
  -- Calculate discount
  v_discount_amount := p_points * v_settings.redemption_rate;
  
  -- Deduct points
  UPDATE user_points
  SET 
    total_points = total_points - p_points,
    total_redeemed = total_redeemed + p_points,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO points_transactions (user_id, points, transaction_type, description_ar, description_en)
  VALUES (
    p_user_id, 
    -p_points, 
    'redeemed',
    'استبدال نقاط للحصول على خصم',
    'Points redeemed for discount'
  );
  
  RETURN v_discount_amount;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_loyalty_settings_updated_at
  BEFORE UPDATE ON public.loyalty_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
