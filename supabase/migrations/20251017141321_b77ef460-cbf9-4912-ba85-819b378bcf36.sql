-- Add is_new_arrival column to products table
ALTER TABLE public.products 
ADD COLUMN is_new_arrival boolean DEFAULT false;