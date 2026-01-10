-- Add order column to categories
ALTER TABLE public.categories ADD COLUMN "order" INTEGER DEFAULT 0;

-- Update existing categories to have an initial order based on creation time or name
WITH ordered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.categories
)
UPDATE public.categories
SET "order" = ordered_rows.rn
FROM ordered_rows
WHERE public.categories.id = ordered_rows.id;

-- You might want to recreate the seeding if starting fresh, or just run the above on existing data.
-- If you want to use the full seeding script again, updated:

/*
-- Create categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT DEFAULT '#94a3b8',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime
alter publication supabase_realtime add table categories;
*/
