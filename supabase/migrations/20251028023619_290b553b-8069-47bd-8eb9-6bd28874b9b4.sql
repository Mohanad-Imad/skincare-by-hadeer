-- Create consultations table
CREATE TABLE public.consultations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  
  -- القسم الأول: المعلومات الشخصية
  full_name text NOT NULL,
  gender text NOT NULL,
  age integer NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  skin_type text,
  
  -- القسم الثاني: المشاكل الرئيسية
  main_concerns text[] NOT NULL,
  other_concern text,
  problem_duration text NOT NULL,
  previous_treatment boolean NOT NULL,
  previous_treatment_details text,
  
  -- القسم الثالث: روتين العناية
  face_wash_frequency text NOT NULL,
  cleanser_type text,
  uses_moisturizer boolean NOT NULL,
  moisturizer_type text,
  uses_sunscreen boolean NOT NULL,
  uses_serums boolean NOT NULL,
  serum_details text,
  removes_makeup text,
  
  -- القسم الرابع: نمط الحياة
  sun_exposure text NOT NULL,
  work_environment text,
  daily_water_intake text NOT NULL,
  smoking_alcohol boolean NOT NULL,
  balanced_diet boolean NOT NULL,
  stress_levels boolean NOT NULL,
  
  -- القسم الخامس: الحالة الصحية
  chronic_diseases text,
  current_medications text,
  allergies text,
  uses_contraceptives boolean,
  is_pregnant_nursing boolean,
  
  -- القسم السادس: الصور والملاحظات
  image_urls text[],
  additional_notes text,
  
  -- القسم السابع: التفضيلات
  consultation_preference text NOT NULL,
  preferred_contact_time text NOT NULL,
  product_preference text NOT NULL,
  
  -- حالة الاستشارة
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  admin_notes text,
  responded_at timestamp with time zone,
  responded_by uuid,
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own consultations"
  ON public.consultations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create consultations"
  ON public.consultations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all consultations"
  ON public.consultations
  FOR ALL
  USING (is_admin(auth.uid()));

-- Update timestamp trigger
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for consultation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-images', 'consultation-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for consultation images
CREATE POLICY "Users can upload consultation images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'consultation-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own consultation images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'consultation-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all consultation images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'consultation-images' 
    AND is_admin(auth.uid())
  );