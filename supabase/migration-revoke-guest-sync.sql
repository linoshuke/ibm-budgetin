REVOKE EXECUTE ON FUNCTION public.sync_guest_data(jsonb) FROM authenticated;
DROP FUNCTION IF EXISTS public.sync_guest_data(jsonb);
DROP FUNCTION IF EXISTS public.normalize_name(text);
