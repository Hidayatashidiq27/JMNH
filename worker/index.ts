// Entry point Cloudflare Worker.
// - /api/scan         : scan struk pakai Gemini (server-side)
// - /api/login        : validasi password admin
// - /api/transactions : CRUD data kas (baca publik, tulis khusus admin)
// - lainnya           : sajikan aset statis (SPA React dari ./dist)

import { handleLogin, handleTransactions } from "./data";
import { handleScan, handleReceipts, handleReceiptImage } from "./receipts";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Cek versi/kesehatan deploy. Jika endpoint ini mengembalikan JSON,
    // berarti kode terbaru (dengan Supabase) sudah aktif.
    if (path === "/api/health") {
      return new Response(
        JSON.stringify({ ok: true, version: "receipts-1", features: ["scan", "login", "transactions", "receipts"] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (path === "/api/scan") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      return handleScan(request, env);
    }

    if (path === "/api/login") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      return handleLogin(request, env);
    }

    if (path === "/api/transactions") {
      return handleTransactions(request, env, url);
    }

    if (path === "/api/receipts/image") {
      return handleReceiptImage(request, env, url);
    }

    if (path === "/api/receipts") {
      return handleReceipts(request, env, url);
    }

    // Selain /api, sajikan file statis (SPA React).
    return env.ASSETS.fetch(request);
  },
};
