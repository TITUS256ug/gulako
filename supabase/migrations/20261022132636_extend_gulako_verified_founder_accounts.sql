BEGIN;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  is_owner boolean;
begin
  is_owner := lower(coalesce(new.email,'')) in (
    'opiotitus33@gmail.com',
    'opiotitus333@gmail.com',
    'opiotituss333@gmail.com',
    'oyagoisaac7@gmail.com'
  ) and new.email_confirmed_at is not null;

  insert into public.profiles (id, email, full_name, role, plan)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    case when is_owner then 'founder' else 'seller' end,
    case when is_owner then 'business' else 'free' end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name),
        role = case when is_owner then 'founder' else public.profiles.role end,
        plan = case when is_owner then 'business' else public.profiles.plan end,
        updated_at = now();

  return new;
end;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE OF email,email_confirmed_at,raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
UPDATE public.profiles p SET role='founder',plan='business',plan_expires_at=null,updated_at=now()
FROM auth.users u WHERE p.id=u.id AND u.email_confirmed_at IS NOT NULL AND lower(u.email) IN ('opiotitus333@gmail.com','opiotituss333@gmail.com','oyagoisaac7@gmail.com','opiotitus33@gmail.com');
COMMIT;