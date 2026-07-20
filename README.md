# Sistem Informasi Kas Masjid Nurul Huda

Aplikasi web untuk mencatat kas masjid, lengkap dengan fitur **pindai laporan (scan) otomatis menggunakan AI (Gemini)**.

Dibangun dengan React + TypeScript + Vite. **Direkomendasikan deploy ke Vercel** (fungsi server berjalan di region AS yang didukung Gemini). Kode juga masih kompatibel dengan Cloudflare Workers (`worker/`).

## Deploy ke Vercel (disarankan)

Cloudflare Workers gratis kadang ditempatkan di lokasi yang diblokir Gemini
(*"User location is not supported"*). Fungsi Vercel berjalan di region AS, jadi
fitur scan stabil. Endpoint ada di folder `api/`.

1. Buka [vercel.com](https://vercel.com) → login pakai GitHub.
2. **Add New → Project** → **Import** repo ini → pilih branch yang benar.
3. Framework otomatis terdeteksi **Vite** (Build: `npm run build`, Output: `dist`).
4. **Settings → Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
5. **Deploy**. Setiap `git push` akan build & deploy otomatis.

## Keamanan API Key

API key Gemini **tidak pernah dikirim ke browser**. Semua pemanggilan AI dilakukan di sisi server (`worker/gemini.ts`, dipakai fungsi `api/scan.ts`), dan key disimpan sebagai variabel rahasia (`GEMINI_API_KEY`). Frontend hanya memanggil endpoint sendiri di `/api/scan`.

## Penyimpanan Data (Supabase)

Data transaksi kas disimpan di **Supabase** (Postgres), bukan lagi di browser.

- **Baca** (`GET /api/transactions`) → terbuka untuk publik (semua orang bisa melihat laporan).
- **Tulis** (tambah/edit/hapus) → hanya admin, divalidasi password di server (`/api/transactions`, `/api/login`).
- Worker mengakses Supabase memakai **Service Role Key** yang disimpan sebagai secret — tidak pernah sampai ke browser.

### Setup Supabase (sekali saja)

1. Buat akun & project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor → New query**, tempel isi file [`supabase/schema.sql`](supabase/schema.sql), lalu **Run** untuk membuat tabel `transactions`.
3. Ambil kredensial di **Project Settings → API**:
   - **Project URL** → untuk `SUPABASE_URL`
   - **service_role key** (bagian *Project API keys*, klik *Reveal*) → untuk `SUPABASE_SERVICE_ROLE_KEY`
     > ⚠️ service_role bersifat rahasia. Jangan pernah ditaruh di kode frontend.

### Secret yang harus diset di Cloudflare Worker

Buka Worker Anda → **Settings → Variables and Secrets**, tambahkan sebagai **Secret**:

| Name | Isi |
|------|-----|
| `GEMINI_API_KEY` | API key Gemini |
| `SUPABASE_URL` | Project URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key Supabase |
| `ADMIN_PASSWORD` | Password login admin (mis. `adminjmnh`) |

Setelah menambah secret, jalankan **Retry deployment**.

---

## Menjalankan di Komputer Lokal

**Prasyarat:** Node.js

1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan aplikasi (tampilan UI saja):
   ```bash
   npm run dev
   ```

> Catatan: `npm run dev` hanya menjalankan frontend. Fitur **scan AI** butuh server, jadi untuk mengujinya secara lokal lihat bagian di bawah.

### Menguji fitur scan AI secara lokal

1. Salin `.dev.vars.example` menjadi `.dev.vars`, lalu isi API key Anda:
   ```
   GEMINI_API_KEY=api_key_gemini_anda
   ```
   (File `.dev.vars` tidak ikut ter-commit — aman.)
2. Build lalu jalankan lewat wrangler:
   ```bash
   npm run cf:dev
   ```
3. Buka URL yang ditampilkan wrangler (biasanya `http://localhost:8787`).

---

## Deploy ke Vercel (disarankan)

> **Kenapa Vercel, bukan Cloudflare?** Gemini API gratis memblokir permintaan dari
> sebagian lokasi pusat data. Cloudflare Workers (plan gratis) sering ditempatkan di
> lokasi yang diblokir sehingga muncul error *"User location is not supported"*.
> Fungsi server Vercel berjalan di region AS yang didukung Gemini, jadi lebih andal.

1. Buat akun di [vercel.com](https://vercel.com) (bisa login pakai GitHub).
2. Klik **Add New… → Project**, lalu **Import** repo **`JMNH`** dari GitHub.
3. Vercel otomatis mendeteksi **Vite**. Biarkan pengaturan default:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Buka **Settings → Environment Variables**, tambahkan:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** API key Gemini Anda
5. Klik **Deploy**. Fungsi di folder `api/` otomatis aktif sebagai `/api/scan`.

Setiap `git push` berikutnya akan build & deploy ulang otomatis.

---

## (Alternatif) Deploy ke Cloudflare Workers

Proyek ini juga siap untuk Cloudflare (`wrangler.jsonc` + folder `worker/`), **tetapi**
fitur scan AI kemungkinan gagal karena pembatasan lokasi Gemini di atas. Gunakan hanya
jika Anda punya cara mem-bypass batasan region tersebut.

1. Login: `npx wrangler login`
2. Simpan secret: `npx wrangler secret put GEMINI_API_KEY`
3. Build & deploy: `npm run build && npm run deploy`
