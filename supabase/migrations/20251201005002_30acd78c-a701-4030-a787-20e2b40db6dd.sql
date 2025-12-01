
-- Create shared_carts table
CREATE TABLE public.shared_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Create index for share_code lookups
CREATE INDEX idx_shared_carts_share_code ON public.shared_carts(share_code);

-- Enable RLS
ALTER TABLE public.shared_carts ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared carts (public sharing)
CREATE POLICY "Anyone can view shared carts"
ON public.shared_carts
FOR SELECT
USING (expires_at > now() OR expires_at IS NULL);

-- Authenticated users can create shared carts
CREATE POLICY "Authenticated users can create shared carts"
ON public.shared_carts
FOR INSERT
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Users can delete their own shared carts
CREATE POLICY "Users can delete own shared carts"
ON public.shared_carts
FOR DELETE
USING (auth.uid() = created_by);
