-- Create main problem categories table
CREATE TABLE public.problem_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sub-problems table
CREATE TABLE public.sub_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.problem_categories(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for products and sub-problems
CREATE TABLE public.product_sub_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sub_problem_id UUID NOT NULL REFERENCES public.sub_problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, sub_problem_id)
);

-- Enable RLS
ALTER TABLE public.problem_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sub_problems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for problem_categories
CREATE POLICY "Anyone can view active problem categories"
  ON public.problem_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage problem categories"
  ON public.problem_categories FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for sub_problems
CREATE POLICY "Anyone can view active sub problems"
  ON public.sub_problems FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage sub problems"
  ON public.sub_problems FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for product_sub_problems
CREATE POLICY "Anyone can view product sub problems"
  ON public.product_sub_problems FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product sub problems"
  ON public.product_sub_problems FOR ALL
  USING (is_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_sub_problems_category ON public.sub_problems(category_id);
CREATE INDEX idx_product_sub_problems_product ON public.product_sub_problems(product_id);
CREATE INDEX idx_product_sub_problems_sub_problem ON public.product_sub_problems(sub_problem_id);

-- Add triggers for updated_at
CREATE TRIGGER update_problem_categories_updated_at
  BEFORE UPDATE ON public.problem_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_problems_updated_at
  BEFORE UPDATE ON public.sub_problems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert main problem categories
INSERT INTO public.problem_categories (name_ar, name_en, slug, display_order) VALUES
('مشاكل البشرة والجسم', 'Skin & Body Problems', 'skin-body-problems', 1),
('مشاكل الشعر', 'Hair Problems', 'hair-problems', 2);

-- Insert sub-problems for skin and body
INSERT INTO public.sub_problems (category_id, name_ar, name_en, slug, display_order)
SELECT 
  (SELECT id FROM public.problem_categories WHERE slug = 'skin-body-problems'),
  name_ar,
  name_en,
  slug,
  display_order
FROM (VALUES
  ('حب الشباب', 'Acne', 'acne', 1),
  ('التصبغات', 'Pigmentation', 'pigmentation', 2),
  ('الرؤوس السوداء', 'Blackheads', 'blackheads', 3),
  ('جفاف البشرة', 'Dry Skin', 'dry-skin', 4),
  ('الهالات السوداء', 'Dark Circles', 'dark-circles', 5),
  ('الخطوط والتجاعيد', 'Lines & Wrinkles', 'lines-wrinkles', 6),
  ('عيون منتفخة', 'Puffy Eyes', 'puffy-eyes', 7),
  ('جلد الوزة', 'Keratosis Pilaris', 'keratosis-pilaris', 8),
  ('الوردية', 'Rosacea', 'rosacea', 9),
  ('زيادة نمو الشعر', 'Excess Hair Growth', 'excess-hair-growth', 10),
  ('الندبات والحروق', 'Scars & Burns', 'scars-burns', 11),
  ('التشققات', 'Stretch Marks', 'stretch-marks', 12),
  ('السيلوليت', 'Cellulite', 'cellulite', 13),
  ('حماية من الشمس', 'Sun Protection', 'sun-protection', 14)
) AS t(name_ar, name_en, slug, display_order);

-- Insert sub-problems for hair
INSERT INTO public.sub_problems (category_id, name_ar, name_en, slug, display_order)
SELECT 
  (SELECT id FROM public.problem_categories WHERE slug = 'hair-problems'),
  name_ar,
  name_en,
  slug,
  display_order
FROM (VALUES
  ('تساقط الشعر', 'Hair Loss', 'hair-loss', 1),
  ('نفشة الشعر', 'Frizzy Hair', 'frizzy-hair', 2),
  ('القشرة', 'Dandruff', 'dandruff', 3),
  ('جفاف فروة الرأس', 'Dry Scalp', 'dry-scalp', 4),
  ('كيرلي', 'Curly Hair', 'curly-hair', 5),
  ('الحفاظ على اللون', 'Color Protection', 'color-protection', 6),
  ('الشعر الباهت', 'Dull Hair', 'dull-hair', 7),
  ('الشعر المتضرر', 'Damaged Hair', 'damaged-hair', 8),
  ('فروة الرأس المتهيجة', 'Irritated Scalp', 'irritated-scalp', 9)
) AS t(name_ar, name_en, slug, display_order);