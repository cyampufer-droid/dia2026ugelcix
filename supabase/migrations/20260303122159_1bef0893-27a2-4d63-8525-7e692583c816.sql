
-- Add must_change_password flag to profiles
ALTER TABLE public.profiles ADD COLUMN must_change_password boolean NOT NULL DEFAULT true;

-- Set all existing users to require password change
UPDATE public.profiles SET must_change_password = true;
