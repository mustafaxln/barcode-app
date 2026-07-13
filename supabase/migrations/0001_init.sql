-- Barkodlu Ürün İçerik Kontrol App — v1 çekirdek şema
-- Bu dosyayı Supabase projenizde SQL Editor'e yapıştırıp çalıştırın
-- (veya Supabase CLI kullanıyorsanız `supabase db push` ile uygulayın).

create table if not exists products (
  barcode text primary key,
  name text not null,
  brand text,
  image_url text,
  ingredients_text text,
  nutrition_json jsonb,
  additives_tags text[] not null default '{}',
  allergens_tags text[] not null default '{}',
  category text,
  source text not null default 'off' check (source in ('off', 'manual')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists manual_submissions (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  name text not null,
  brand text,
  ingredients_text text,
  nutrition_json jsonb,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists manual_submissions_status_idx on manual_submissions (status);

-- RLS: products herkese açık okunur, yazma sadece anon key ile insert/upsert
-- (cache amaçlı; gerçek moderasyon manual_submissions üzerinden yapılır).
alter table products enable row level security;

create policy "products are publicly readable"
  on products for select
  using (true);

create policy "anyone can insert cache entries"
  on products for insert
  with check (true);

create policy "anyone can update cache entries"
  on products for update
  using (true);

-- RLS: manual_submissions herkes insert edebilir, okuma/onay şimdilik
-- Supabase dashboard'dan (service role ile) yapılacak, anon select kapalı.
alter table manual_submissions enable row level security;

create policy "anyone can submit a manual product"
  on manual_submissions for insert
  with check (true);
