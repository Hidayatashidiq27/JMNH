# Sistem Informasi Kas Masjid Nurul Huda

Aplikasi web untuk mencatat kas masjid, lengkap dengan fitur **pindai laporan (scan) otomatis menggunakan AI (Gemini)**.

Dibangun dengan React + TypeScript + Vite, dan di-deploy ke **Cloudflare Pages**.

## Keamanan API Key

API key Gemini **tidak pernah dikirim ke browser**. Semua pemanggilan AI dilakukan di sisi server lewat Cloudflare Function (`functions/api/scan.ts`), dan key disimpan sebagai variabel rahasia (`GEMINI_API_KEY`). Frontend hanya memanggil endpoint sendiri di `/api/scan`.

---

## Menjalankan di Komputer Lokal

**Prasyarat:** Node.js

1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan aplikasi (tampilan UI):
   ```bash
   npm run dev
   ```

> Catatan: `npm run dev` hanya menjalankan frontend. Fitur **scan AI** membutuhkan Cloudflare Function, jadi untuk mengujinya secara lokal lihat bagian di bawah.

### Menguji fitur scan AI secara lokal (dengan Cloudflare Function)

1. Salin `.dev.vars.example` menjadi `.dev.vars`, lalu isi API key Anda:
   ```
   GEMINI_API_KEY=api_key_gemini_anda
   ```
   (File `.dev.vars` tidak ikut ter-commit — aman.)
2. Build lalu jalankan lewat wrangler:
   ```bash
   npm run build
   npx wrangler pages dev dist
   ```
3. Buka URL yang ditampilkan wrangler (biasanya `http://localhost:8788`).

---

## Deploy ke Cloudflare Pages

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pilih repository GitHub ini (`JMNH`) dan branch yang ingin di-deploy.
3. Isi pengaturan build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Buka **Settings → Environment variables**, tambahkan variabel rahasia:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** API key Gemini Anda
   - (Simpan sebagai *Secret* / encrypted.)
5. Klik **Save and Deploy**.

Cloudflare otomatis mendeteksi folder `functions/` dan mengaktifkan endpoint `/api/scan`. Setiap kali Anda `git push`, Cloudflare akan build & deploy ulang secara otomatis.
