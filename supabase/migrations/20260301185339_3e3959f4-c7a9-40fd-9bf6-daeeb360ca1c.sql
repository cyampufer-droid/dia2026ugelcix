-- First, create a temporary function to bootstrap the admin user
-- This bypasses the need for an existing admin to call the edge function
DO $$
DECLARE
  _user_id uuid;
BEGIN
  -- Check if user already exists in auth.users by looking at profiles
  -- If not, we need to create via a different approach
  -- Since we can't create auth users from SQL, we'll just prepare the role assignment
  -- The user will be created via the edge function
  NULL;
END;
$$;