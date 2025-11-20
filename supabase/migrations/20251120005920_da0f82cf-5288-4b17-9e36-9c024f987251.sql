-- Create drop_hint_settings table
CREATE TABLE public.drop_hint_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  button_text_ar text NOT NULL DEFAULT 'لمّح للحبايب',
  funny_message_ar text NOT NULL DEFAULT 'أهلين! شفت هذا الزين في متجر هدير وقلت ما يغلى عليّ.. إذا محتار وش تهديني بمناسبة (أو بدون مناسبة)، هذا الرابط يسهل عليك المهمة 😉 {URL}',
  formal_message_ar text NOT NULL DEFAULT 'صباح الخير.. مر عليّ هذا المنتج في متجر هدير وحسيته ذوقي جداً.. حبيت أشاركك إياه لأخذ رأيك (أو تلميح بسيط لهدية قادمة 🎁) {URL}',
  urgent_message_ar text NOT NULL DEFAULT 'لا يفوتك! لقيت هذا الشيء الرهيب وسعره لقطة، شكلي بطلبه بس قلت أوريك إياه قبل ما يخلص.. أو لو حاب تسبقني وتهديني إياه ما بقول لا 😉 {URL}',
  discount_code text,
  discount_suffix_ar text DEFAULT 'وهمين اكو كود خصم اذا نويت: {CODE}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drop_hint_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view drop hint settings"
  ON public.drop_hint_settings
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage drop hint settings"
  ON public.drop_hint_settings
  FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.drop_hint_settings (button_text_ar, funny_message_ar, formal_message_ar, urgent_message_ar)
VALUES (
  'لمّح للحبايب',
  'أهلين! شفت هذا الزين في متجر هدير وقلت ما يغلى عليّ.. إذا محتار وش تهديني بمناسبة (أو بدون مناسبة)، هذا الرابط يسهل عليك المهمة 😉 {URL}',
  'صباح الخير.. مر عليّ هذا المنتج في متجر هدير وحسيته ذوقي جداً.. حبيت أشاركك إياه لأخذ رأيك (أو تلميح بسيط لهدية قادمة 🎁) {URL}',
  'لا يفوتك! لقيت هذا الشيء الرهيب وسعره لقطة، شكلي بطلبه بس قلت أوريك إياه قبل ما يخلص.. أو لو حاب تسبقني وتهديني إياه ما بقول لا 😉 {URL}'
);

-- Create trigger for updated_at
CREATE TRIGGER update_drop_hint_settings_updated_at
  BEFORE UPDATE ON public.drop_hint_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();