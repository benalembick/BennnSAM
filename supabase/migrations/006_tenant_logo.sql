-- Add company logo support to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
