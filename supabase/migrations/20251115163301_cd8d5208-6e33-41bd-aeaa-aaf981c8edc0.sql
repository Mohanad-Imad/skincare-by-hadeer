-- Create guarantee_settings table
CREATE TABLE public.guarantee_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Banner Settings
  banner_title_ar TEXT,
  banner_title_en TEXT,
  banner_description_ar TEXT,
  banner_description_en TEXT,
  banner_button_text_ar TEXT DEFAULT 'اعرف المزيد',
  banner_button_text_en TEXT DEFAULT 'Learn More',
  
  -- Page Content
  page_title_ar TEXT NOT NULL DEFAULT 'ضمان الاسترجاع',
  page_title_en TEXT NOT NULL DEFAULT 'Return Guarantee',
  page_subtitle_ar TEXT,
  page_subtitle_en TEXT,
  page_description_ar TEXT NOT NULL DEFAULT 'نحن نضمن لك حقك في استرجاع المنتج',
  page_description_en TEXT NOT NULL DEFAULT 'We guarantee your right to return the product',
  
  -- Guarantee Features (JSON array)
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Terms and Conditions
  terms_ar TEXT,
  terms_en TEXT,
  
  -- Contact Information
  contact_title_ar TEXT DEFAULT 'تواصل معنا',
  contact_title_en TEXT DEFAULT 'Contact Us',
  contact_description_ar TEXT,
  contact_description_en TEXT
);

-- Enable RLS
ALTER TABLE public.guarantee_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view guarantee settings"
  ON public.guarantee_settings
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage guarantee settings"
  ON public.guarantee_settings
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_guarantee_settings_updated_at
  BEFORE UPDATE ON public.guarantee_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data
INSERT INTO public.guarantee_settings (
  banner_title_ar,
  banner_title_en,
  banner_description_ar,
  banner_description_en,
  page_subtitle_ar,
  page_subtitle_en,
  features,
  terms_ar,
  terms_en
) VALUES (
  'ضمان استرجاع المنتج',
  'Product Return Guarantee',
  'نوفر لك ضمان استرجاع كامل للمنتج في حال عدم رضاك',
  'We provide you with a full product return guarantee if you are not satisfied',
  'نضمن لك حقك في الاسترجاع بكل سهولة',
  'We guarantee your right to return with ease',
  '[
    {
      "icon": "shield",
      "title_ar": "ضمان 30 يوم",
      "title_en": "30 Day Guarantee",
      "description_ar": "يمكنك استرجاع المنتج خلال 30 يوم من تاريخ الشراء",
      "description_en": "You can return the product within 30 days from the purchase date"
    },
    {
      "icon": "refresh",
      "title_ar": "استرجاع مجاني",
      "title_en": "Free Return",
      "description_ar": "نوفر لك خدمة الاسترجاع المجاني دون أي تكاليف إضافية",
      "description_en": "We provide you with free return service without any additional costs"
    },
    {
      "icon": "check",
      "title_ar": "فحص المنتج",
      "title_en": "Product Inspection",
      "description_ar": "يمكنك فحص المنتج قبل القبول النهائي",
      "description_en": "You can inspect the product before final acceptance"
    },
    {
      "icon": "coins",
      "title_ar": "استرجاع كامل المبلغ",
      "title_en": "Full Refund",
      "description_ar": "نضمن لك استرجاع كامل المبلغ المدفوع",
      "description_en": "We guarantee you a full refund of the amount paid"
    }
  ]'::jsonb,
  '• يجب أن يكون المنتج في حالته الأصلية مع العبوة
• يتم الاسترجاع خلال 30 يوم من تاريخ الاستلام
• المنتجات المستخدمة أو المفتوحة غير قابلة للاسترجاع
• يتم استرجاع المبلغ خلال 7-14 يوم عمل
• تكاليف الشحن غير قابلة للاسترجاع',
  '• The product must be in its original condition with packaging
• Return within 30 days from the date of receipt
• Used or opened products are not returnable
• The amount will be refunded within 7-14 business days
• Shipping costs are non-refundable'
);