-- Extend store_settings table with all needed fields
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS about_ar text DEFAULT 'نوفر لك أفضل منتجات العناية بالبشرة والجمال من أشهر العلامات التجارية العالمية بأسعار منافسة وجودة عالية.',
ADD COLUMN IF NOT EXISTS about_en text DEFAULT 'We provide you with the best skincare and beauty products from famous international brands at competitive prices and high quality.',
ADD COLUMN IF NOT EXISTS phone text DEFAULT '+9647748209420',
ADD COLUMN IF NOT EXISTS email text DEFAULT 'skincareby.hadeer@gmail.com',
ADD COLUMN IF NOT EXISTS address_ar text DEFAULT 'بابل، العراق - المحاويل',
ADD COLUMN IF NOT EXISTS address_en text DEFAULT 'Babylon, Iraq - Al-Mahaweel',
ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT 'https://www.facebook.com/share/172mEBGsey/',
ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT 'https://www.instagram.com/skincare.by.hadeer?igsh=MXR5cHdhMHI0cjAyZA==',
ADD COLUMN IF NOT EXISTS tiktok_url text DEFAULT 'https://www.tiktok.com/@skincare.hadeer?_t=8rqGIXgOaBN&_r=1',
ADD COLUMN IF NOT EXISTS whatsapp_url text DEFAULT 'https://wa.me/9647748209420',
ADD COLUMN IF NOT EXISTS footer_text_ar text DEFAULT 'تابعونا على مواقع التواصل الاجتماعي للحصول على آخر العروض والمنتجات الجديدة',
ADD COLUMN IF NOT EXISTS footer_text_en text DEFAULT 'Follow us on social media for the latest offers and new products',
ADD COLUMN IF NOT EXISTS theme_primary_color text DEFAULT '330 81% 65%',
ADD COLUMN IF NOT EXISTS theme_secondary_color text DEFAULT '60 4.8% 95.9%',
ADD COLUMN IF NOT EXISTS theme_accent_color text DEFAULT '60 4.8% 95.9%';