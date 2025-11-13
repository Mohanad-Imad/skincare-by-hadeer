-- Add responsive image columns to banners table
ALTER TABLE banners 
ADD COLUMN image_url_desktop TEXT,
ADD COLUMN image_url_tablet TEXT,
ADD COLUMN image_url_mobile TEXT;

-- Make text fields optional in banners
ALTER TABLE banners 
ALTER COLUMN title_ar DROP NOT NULL,
ALTER COLUMN title_en DROP NOT NULL,
ALTER COLUMN description_ar DROP NOT NULL,
ALTER COLUMN description_en DROP NOT NULL,
ALTER COLUMN button_text_ar DROP NOT NULL,
ALTER COLUMN button_text_en DROP NOT NULL;

-- Add responsive image columns to secondary_banners table
ALTER TABLE secondary_banners 
ADD COLUMN image_url_desktop TEXT,
ADD COLUMN image_url_tablet TEXT,
ADD COLUMN image_url_mobile TEXT;

-- Make text fields optional in secondary_banners
ALTER TABLE secondary_banners 
ALTER COLUMN title_ar DROP NOT NULL,
ALTER COLUMN title_en DROP NOT NULL,
ALTER COLUMN description_ar DROP NOT NULL,
ALTER COLUMN description_en DROP NOT NULL,
ALTER COLUMN button_text_ar DROP NOT NULL,
ALTER COLUMN button_text_en DROP NOT NULL;

-- Add responsive image columns to tertiary_banners table
ALTER TABLE tertiary_banners 
ADD COLUMN image_url_desktop TEXT,
ADD COLUMN image_url_tablet TEXT,
ADD COLUMN image_url_mobile TEXT;

-- Make text fields optional in tertiary_banners
ALTER TABLE tertiary_banners 
ALTER COLUMN title_ar DROP NOT NULL,
ALTER COLUMN title_en DROP NOT NULL,
ALTER COLUMN description_ar DROP NOT NULL,
ALTER COLUMN description_en DROP NOT NULL,
ALTER COLUMN button_text_ar DROP NOT NULL,
ALTER COLUMN button_text_en DROP NOT NULL;