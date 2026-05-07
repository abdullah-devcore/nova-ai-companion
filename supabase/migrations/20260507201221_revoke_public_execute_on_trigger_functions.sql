/*
  # Revoke PUBLIC Execute on Trigger Functions

  The previous migration revoked from `anon` and `authenticated` roles directly,
  but PostgreSQL grants EXECUTE to `PUBLIC` by default on new functions.
  Since `anon` and `authenticated` inherit from `PUBLIC`, they still had
  execute permission. This migration revokes from `PUBLIC` instead.

  1. Changes
    - Revoke EXECUTE on `handle_new_user()` from PUBLIC
    - Revoke EXECUTE on `update_updated_at()` from PUBLIC
    - Only `postgres` and `service_role` retain EXECUTE, which is correct
      since the functions are only called by database triggers.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC;
