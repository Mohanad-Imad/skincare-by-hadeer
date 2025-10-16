-- Add company name fields to products table
ALTER TABLE public.products
ADD COLUMN company_name_en TEXT,
ADD COLUMN company_name_ar TEXT;