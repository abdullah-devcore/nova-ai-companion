/*
  # Add profile auto-creation on signup

  1. New Functions
    - `public.handle_new_user()`: Trigger function that automatically creates
      a profile row in the `profiles` table when a new user signs up via
      Supabase Auth. It copies the `display_name` from the user's metadata
      into the profile's `display_name` column.

  2. New Triggers
    - `on_auth_user_created`: After a row is inserted into `auth.users`,
      the trigger calls `handle_new_user()` to create the corresponding profile.

  3. Security
    - The function is created with `SECURITY DEFINER` so it runs as the
      database owner, allowing it to INSERT into the `profiles` table
      even though the calling context (the auth system) has no direct
      INSERT permission on `profiles`.
    - `REVOKE EXECUTE` from public to prevent anyone from calling the
      function directly; it can only be invoked by the trigger.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
