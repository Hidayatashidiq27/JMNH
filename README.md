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

## Deploy ke Cloudflare (lewat Workers)

Cloudflare kini mengarahkan pembuatan aplikasi baru ke **Workers** (Workers sudah bisa host situs statis + fungsi sekaligus). Proyek ini sudah disiapkan untuk itu (lihat `wrangler.jsonc` dan folder `worker/`).

### Cara A — Connect ke GitHub (deploy otomatis tiap push)

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**.
2. Pilih **Import a repository** (hubungkan akun GitHub Anda), lalu pilih repo **`JMNH`** dan branch yang diinginkan.
3. Isi pengaturan build:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
4. Selesaikan pembuatan, lalu buka **Settings → Variables and Secrets** pada Worker tersebut dan tambahkan:
   - **Type:** Secret
   - **Name:** `GEMINI_API_KEY`
   - **Value:** API key Gemini Anda
5. Trigger ulang deploy (Retry deployment) agar secret terpakai. Setiap `git push` berikutnya akan build & deploy otomatis.

### Cara B — Deploy langsung dari komputer (CLI)

1. Login sekali: `npx wrangler login`
2. Simpan API key sebagai secret:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
   (tempel API key saat diminta)
3. Build dan deploy:
   ```bash
   npm run build
   npm run deploy
   ```

Setelah deploy, buka URL `*.workers.dev` yang diberikan Cloudflare.
