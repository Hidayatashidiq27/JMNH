-- =====================================================================
-- Skema database Supabase untuk Sistem Informasi Kas Masjid Nurul Huda
-- Cara pakai: buka project Supabase Anda -> menu "SQL Editor" -> "New query"
-- -> tempel seluruh isi file ini -> klik "Run".
-- =====================================================================

create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  activity   text not null,
  amount     numeric not null default 0,
  type       text not null check (type in ('IN', 'OUT')),
  category   text not null default 'Umum',
  created_at timestamptz not null default now()
);

-- Aktifkan Row Level Security.
-- Semua akses aplikasi berjalan lewat Worker memakai SERVICE ROLE KEY,
-- yang MELEWATI RLS. Karena tidak ada policy publik yang dibuat, tabel ini
-- TIDAK bisa diakses langsung dari luar (mis. pakai anon key) — aman.
alter table public.transactions enable row level security;

-- (Opsional) Data contoh awal supaya laporan tidak kosong saat pertama dibuka.
-- Hapus blok ini jika Anda ingin mulai dari nol.
insert into public.transactions (date, activity, amount, type, category) values
  ('2024-05-10', 'Infaq Jumat',           2500000, 'IN',  'Infaq'),
  ('2024-05-12', 'Bayar Listrik Mei',      850000, 'OUT', 'Operasional'),
  ('2024-05-15', 'Sodakoh Pembangunan',   5000000, 'IN',  'Pembangunan'),
  ('2024-05-18', 'Servis AC Masjid',       450000, 'OUT', 'Pemeliharaan');
