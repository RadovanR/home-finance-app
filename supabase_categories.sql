-- Create categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT DEFAULT '#94a3b8',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime
alter publication supabase_realtime add table categories;

-- Seed default Income categories
INSERT INTO public.categories (name, type, color) VALUES
('Výplata', 'income', '#10b981'), -- emerald-500
('Darčeky', 'income', '#8b5cf6'), -- violet-500
('Iné', 'income', '#94a3b8');   -- slate-400

-- Seed default Expense categories
INSERT INTO public.categories (name, type, color) VALUES
('Potraviny', 'expense', '#f59e0b'), -- amber-500
('Bývanie', 'expense', '#3b82f6'),   -- blue-500
('Nájom', 'expense', '#6366f1'),     -- indigo-500
('Doprava', 'expense', '#ef4444'),   -- red-500
('Paušál', 'expense', '#14b8a6'),    -- teal-500
('Splátka', 'expense', '#f97316'),   -- orange-500
('Zábava', 'expense', '#ec4899'),    -- pink-500
('Dovolenka', 'expense', '#06b6d4'), -- cyan-500
('Zdravie', 'expense', '#84cc16'),   -- lime-500
('Nákupy', 'expense', '#a855f7'),    -- purple-500
('Tankovanie', 'expense', '#f43f5e'), -- rose-500
('Zdravotné poistenie', 'expense', '#ef4444'),
('Sociálne poistenie', 'expense', '#ef4444'),
('Dane', 'expense', '#64748b'),
('Iné', 'expense', '#94a3b8');
