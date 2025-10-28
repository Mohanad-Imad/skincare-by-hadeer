-- Make English fields nullable in celebrity_routines table
ALTER TABLE celebrity_routines 
  ALTER COLUMN celebrity_name_en DROP NOT NULL,
  ALTER COLUMN country_en DROP NOT NULL,
  ALTER COLUMN morning_routine_en DROP NOT NULL,
  ALTER COLUMN evening_routine_en DROP NOT NULL;

-- Set default empty string for English fields if they are null
ALTER TABLE celebrity_routines 
  ALTER COLUMN celebrity_name_en SET DEFAULT '',
  ALTER COLUMN country_en SET DEFAULT '',
  ALTER COLUMN morning_routine_en SET DEFAULT '',
  ALTER COLUMN evening_routine_en SET DEFAULT '';