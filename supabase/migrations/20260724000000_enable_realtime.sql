-- Enable Realtime for the orders table so the web app gets live database updates
begin;
  -- Check if the publication exists before attempting to alter it
  do $$
  begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      -- Avoid error if orders is already added
      if not exists (
        select 1 
        from pg_publication_tables 
        where pubname = 'supabase_realtime' 
          and schemaname = 'public' 
          and tablename = 'orders'
      ) then
        alter publication supabase_realtime add table public.orders;
      end if;
    end if;
  end $$;
commit;
