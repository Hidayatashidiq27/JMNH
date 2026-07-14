# Sistem Informasi Kas Masjid Nurul Huda

Aplikasi web untuk mencatat kas masjid, lengkap dengan fitur **pindai laporan (scan) otomatis menggunakan AI (Gemini)**.

Dibangun dengan React + TypeScript + Vite, dan di-deploy ke **Cloudflare Workers** (situs statis + fungsi server).

## Keamanan API Key

API key Gemini **tidak pernah dikirim ke browser**. Semua pemanggilan AI dilakukan di sisi server (`worker/gemini.ts`), dan key disimpan sebagai variabel rahasia (`GEMINI_API_KEY`). Frontend hanya memanggil endpoint sendiri di `/api/scan`.

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
