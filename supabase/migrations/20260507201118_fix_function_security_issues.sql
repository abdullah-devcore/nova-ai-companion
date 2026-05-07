/*
  # Fix Function Security Issues

  1. Search Path Mutability
    - Both `update_updated_at()` and `handle_new_user()` have mutable search_path,
      allowing search path manipulation attacks. Fixed by setting `search_path = ''`
      on both functions, which forces all schema-qualified references.

  2. SECURITY DEFINER Execution Permissions
    - `handle_new_user()` is a SECURITY DEFINER function (it needs elevated
      privileges to insert into `profiles` table during auth trigger execution).
      However, both `anon` and `authenticated` roles could execute it directly
      via `/rest/v1/rpc/handle_new_user`, which is a security risk.
    - Revoked EXECUTE from `anon` and `authenticated` on `handle_new_user()`.
      The function is only called by a database trigger on `auth.users`, not
      via the REST API, so public execution is unnecessary.
    - Also revoked EXECUTE from `anon` and `authenticated` on `update_updated_at()`
      since it is a trigger function not meant to be called via RPC.

  3. Security Notes
    - `handle_new_user()` remains SECURITY DEFINER because it runs as a trigger
      on `auth.users` inserts and needs to write to `public.profiles` without
      requiring the calling user to have direct insert permissions.
    - Both functions now have an explicit `search_path = ''` to prevent any
      search path based attacks.
*/

-- Fix search_path mutability and revoke public execute on both functions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$function$;

-- Revoke execute from anon and authenticated on handle_new_user (SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Revoke execute from anon and authenticated on update_updated_at (trigger-only)
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM authenticated;
