-- Drop the existing foreign key constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_discount_code_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE public.orders 
ADD CONSTRAINT orders_discount_code_id_fkey 
FOREIGN KEY (discount_code_id) 
REFERENCES public.discount_codes(id) 
ON DELETE SET NULL;