-- Make title and description fields nullable in banners table
ALTER TABLE public.banners 
ALTER COLUMN title_ar DROP NOT NULL,
ALTER COLUMN description_ar DROP NOT NULL;