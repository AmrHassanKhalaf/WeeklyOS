revoke all on function public.handle_new_user_ai_settings() from public;
revoke all on function public.handle_new_user_ai_settings() from anon;
revoke all on function public.handle_new_user_ai_settings() from authenticated;

drop policy if exists "Public Read Access" on storage.objects;
