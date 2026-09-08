-- States&Swaad — Supabase schema + seed
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: seed uses ON CONFLICT DO NOTHING so it won't duplicate rows.

-- 1. Admins -------------------------------------------------------------------
-- Created first because menu_items' policies below reference this table.
-- No app-facing way to add a row here on purpose — after signing up at
-- /admin once, add yourself via Supabase dashboard -> Table Editor ->
-- admins -> Insert row, pasting your user id from Authentication -> Users.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

drop policy if exists "a user can check their own admin membership" on admins;
create policy "a user can check their own admin membership"
  on admins for select
  using (auth.uid() = user_id);

-- 2. Menu items --------------------------------------------------------------
create table if not exists menu_items (
  id text primary key,
  category text not null,
  name text not null,
  description text not null default '',
  base_price numeric not null default 0,
  emoji text default '',
  image_url text,
  popular boolean not null default false,
  veg boolean not null default true,
  available boolean not null default true,
  variants jsonb not null default '[]',
  addons jsonb not null default '[]',
  allow_spice_level boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table menu_items enable row level security;

drop policy if exists "menu_items are publicly readable" on menu_items;
create policy "menu_items are publicly readable"
  on menu_items for select
  using (true);

drop policy if exists "admins can insert menu_items" on menu_items;
create policy "admins can insert menu_items"
  on menu_items for insert
  with check (exists (select 1 from admins where user_id = auth.uid()));

drop policy if exists "admins can update menu_items" on menu_items;
create policy "admins can update menu_items"
  on menu_items for update
  using (exists (select 1 from admins where user_id = auth.uid()));

drop policy if exists "admins can delete menu_items" on menu_items;
create policy "admins can delete menu_items"
  on menu_items for delete
  using (exists (select 1 from admins where user_id = auth.uid()));

-- 3. Customer profiles ---------------------------------------------------------
-- Powers "save details for faster checkout" — one row per signed-up customer.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  address text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "a user can read their own profile" on profiles;
create policy "a user can read their own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "a user can update their own profile" on profiles;
create policy "a user can update their own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "a user can insert their own profile" on profiles;
create policy "a user can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Seed the current menu (19 items) ------------------------------------------
insert into menu_items (id, category, name, description, base_price, emoji, popular, veg, variants, addons, allow_spice_level, sort_order) values
('podi-idli', 'idli', 'Podi Idli', 'Soft steamed idli tossed in signature spiced podi and ghee.', 80, '🍚', true, true, '[{"id":"qty-4","name":"4 pcs","priceDelta":0},{"id":"qty-6","name":"6 pcs","priceDelta":30},{"id":"qty-8","name":"8 pcs","priceDelta":60}]'::jsonb, '[{"id":"extra-ghee","name":"Extra ghee","price":10},{"id":"extra-podi","name":"Extra podi (pack)","price":15},{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, true, 1),
('plain-idli', 'idli', 'Plain Idli', 'Classic soft idli served with chutney and sambar.', 60, '⚪', false, true, '[{"id":"qty-4","name":"4 pcs","priceDelta":0},{"id":"qty-6","name":"6 pcs","priceDelta":25}]'::jsonb, '[{"id":"extra-sambar","name":"Extra sambar","price":15},{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, false, 2),
('rava-idli', 'idli', 'Rava Idli', 'Semolina idli studded with mustard, curry leaves, and cashew.', 70, '🍥', false, true, '[{"id":"qty-4","name":"4 pcs","priceDelta":0},{"id":"qty-6","name":"6 pcs","priceDelta":30}]'::jsonb, '[{"id":"extra-ghee","name":"Extra ghee","price":10},{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, true, 3),
('podi-dosa', 'dosa', 'Podi Dosa', 'Crisp dosa layered with podi and ghee, folded fresh.', 90, '🌯', true, true, '[{"id":"single","name":"Single","priceDelta":0},{"id":"double","name":"Double layer","priceDelta":35}]'::jsonb, '[{"id":"extra-ghee","name":"Extra ghee","price":10},{"id":"extra-podi","name":"Extra podi (pack)","price":15},{"id":"cheese","name":"Cheese filling","price":30}]'::jsonb, true, 4),
('masala-dosa', 'dosa', 'Masala Dosa', 'Crisp dosa with spiced potato masala filling.', 100, '🌮', false, true, '[{"id":"single","name":"Single","priceDelta":0},{"id":"double","name":"Double layer","priceDelta":35}]'::jsonb, '[{"id":"extra-podi","name":"Extra podi (pack)","price":15},{"id":"cheese","name":"Cheese filling","price":30}]'::jsonb, true, 5),
('uttapam', 'dosa', 'Onion Uttapam', 'Thick savory pancake topped with onion, tomato, and coriander.', 90, '🥞', false, true, '[{"id":"onion","name":"Onion","priceDelta":0},{"id":"mixed-veg","name":"Mixed veg","priceDelta":15}]'::jsonb, '[{"id":"extra-podi","name":"Extra podi (pack)","price":15},{"id":"cheese","name":"Cheese topping","price":30}]'::jsonb, true, 6),
('medu-vada', 'tiffins', 'Medu Vada', 'Crisp, fluffy lentil doughnuts served with sambar and coconut chutney.', 50, '🍩', true, true, '[{"id":"qty-2","name":"2 pcs","priceDelta":0},{"id":"qty-4","name":"4 pcs","priceDelta":40}]'::jsonb, '[{"id":"extra-sambar","name":"Extra sambar","price":15},{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, false, 7),
('sambar-vada', 'tiffins', 'Sambar Vada', 'Medu vada soaked in hot sambar, topped with coriander.', 70, '🍩', false, true, '[{"id":"qty-2","name":"2 pcs","priceDelta":0},{"id":"qty-4","name":"4 pcs","priceDelta":50}]'::jsonb, '[{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, true, 8),
('upma', 'tiffins', 'Rava Upma', 'Semolina upma tempered with mustard, curry leaves, and cashew, served with chutney.', 50, '🥣', false, true, '[{"id":"regular","name":"Regular","priceDelta":0},{"id":"large","name":"Large","priceDelta":25}]'::jsonb, '[{"id":"extra-ghee","name":"Extra ghee","price":10},{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, true, 9),
('appam', 'tiffins', 'Appam', 'Soft, lacy rice-and-coconut pancakes, best with vegetable stew.', 60, '🥞', false, true, '[{"id":"qty-2","name":"2 pcs","priceDelta":0},{"id":"qty-4","name":"4 pcs","priceDelta":45}]'::jsonb, '[{"id":"extra-stew","name":"Extra vegetable stew","price":25}]'::jsonb, true, 10),
('coconut-chutney', 'sides', 'Coconut Chutney', 'Fresh ground coconut chutney tempered with mustard and curry leaves.', 30, '🥥', false, true, '[{"id":"small","name":"Small cup","priceDelta":0},{"id":"large","name":"Large cup","priceDelta":20}]'::jsonb, '[]'::jsonb, false, 11),
('sambar', 'sides', 'Sambar', 'Toor dal and vegetable stew, slow-cooked with tamarind and spices.', 40, '🍲', true, true, '[{"id":"small","name":"Small bowl","priceDelta":0},{"id":"large","name":"Large bowl","priceDelta":25}]'::jsonb, '[]'::jsonb, true, 12),
('rasam', 'sides', 'Rasam', 'Tangy tomato and tamarind rasam, tempered with pepper and cumin.', 40, '🍅', false, true, '[{"id":"small","name":"Small bowl","priceDelta":0},{"id":"large","name":"Large bowl","priceDelta":25}]'::jsonb, '[]'::jsonb, true, 13),
('curd-rice', 'sides', 'Curd Rice', 'Cooling curd rice tempered with mustard, curry leaves, and pomegranate.', 70, '🍚', true, true, '[{"id":"regular","name":"Regular","priceDelta":0},{"id":"large","name":"Large","priceDelta":30}]'::jsonb, '[{"id":"extra-pickle","name":"Extra pickle","price":10}]'::jsonb, false, 14),
('lemon-rice', 'sides', 'Lemon Rice', 'Tangy tempered rice with peanuts, curry leaves, and turmeric.', 70, '🍋', false, true, '[{"id":"regular","name":"Regular","priceDelta":0},{"id":"large","name":"Large","priceDelta":30}]'::jsonb, '[{"id":"extra-peanuts","name":"Extra peanuts","price":10}]'::jsonb, true, 15),
('filter-coffee', 'beverages', 'Filter Coffee', 'Strong, frothy South Indian filter coffee served in a traditional tumbler.', 30, '☕', true, true, '[{"id":"single","name":"Single","priceDelta":0},{"id":"strong","name":"Extra strong","priceDelta":10}]'::jsonb, '[]'::jsonb, false, 16),
('buttermilk', 'beverages', 'Spiced Buttermilk', 'Chilled buttermilk with curry leaves, ginger, and a hint of spice.', 25, '🥛', false, true, '[{"id":"regular","name":"Regular","priceDelta":0}]'::jsonb, '[]'::jsonb, false, 17),
('idli-dosa-combo', 'combo', 'Idli–Dosa Combo', '2 podi idli + 1 podi dosa, with podi and chutney on the side.', 150, '🍽️', true, true, '[{"id":"regular","name":"Regular","priceDelta":0}]'::jsonb, '[{"id":"extra-podi","name":"Extra podi (pack)","price":15},{"id":"extra-chutney","name":"Extra chutney","price":15}]'::jsonb, true, 18),
('podi-jar', 'beverages', 'Podi Jar (200g)', 'Take our signature podi home — great with rice, dosa, or as a snack mix.', 120, '🫙', false, true, '[{"id":"regular","name":"Regular spice","priceDelta":0},{"id":"extra-spicy","name":"Extra spicy","priceDelta":0}]'::jsonb, '[]'::jsonb, false, 19)
on conflict (id) do nothing;
