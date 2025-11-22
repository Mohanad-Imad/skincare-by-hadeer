-- إضافة حقل لتفعيل/تعطيل شريط العد التنازلي
ALTER TABLE shipping_settings 
ADD COLUMN IF NOT EXISTS show_countdown_bar boolean DEFAULT false;