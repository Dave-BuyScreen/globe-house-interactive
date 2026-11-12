-- Run AFTER the Base44 media files are uploaded to Storage bucket "uploads", folder "base44".
-- Rewrites every media.base44.com / base44.app file URL in text and jsonb columns of the app tables.
do $$
declare c record; new_prefix text := 'https://ohfjvvllqlkbxduslypl.supabase.co/storage/v1/object/public/uploads/base44/';
  pattern text := 'https://(media\.base44\.com|base44\.app)/[^"'' ]*/([^/"''? ]+)(\?[^"'' ]*)?';
begin
  for c in
    select table_name, column_name, data_type from information_schema.columns
    where table_schema = 'public' and data_type in ('text', 'jsonb')
      and table_name in (select tablename from pg_tables where schemaname = 'public')
  loop
    if c.data_type = 'jsonb' then
      execute format('update public.%I set %I = regexp_replace(%I::text, %L, %L || ''\2'', ''g'')::jsonb where %I::text ~ %L',
        c.table_name, c.column_name, c.column_name, pattern, new_prefix, c.column_name, pattern);
    else
      execute format('update public.%I set %I = regexp_replace(%I, %L, %L || ''\2'', ''g'') where %I ~ %L',
        c.table_name, c.column_name, c.column_name, pattern, new_prefix, c.column_name, pattern);
    end if;
  end loop;
end $$;
