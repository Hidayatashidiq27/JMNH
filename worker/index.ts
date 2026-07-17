// Entry point Cloudflare Worker.
// - /api/scan         : scan struk pakai Gemini (server-side)
// - /api/login        : validasi password admin
// - /api/transactions : CRUD data kas (baca publik, tulis khusus admin)
// - lainnya           : sajikan aset statis (SPA React dari ./dist)

import { runScan } from "./gemini";
import { handleLogin, handleTransactions } from "./data";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Cek versi/kesehatan deploy. Jika endpoint ini mengembalikan JSON,
    // berarti kode terbaru (dengan Supabase) sudah aktif.
    if (path === "/api/health") {
      return new Response(
        JSON.stringify({ ok: true, version: "supabase-1", features: ["scan", "login", "transactions"] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (path === "/api/scan") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      return runScan(request, env);
    }

    if (path === "/api/login") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      return handleLogin(request, env);
    }

    if (path === "/api/transactions") {
      return handleTransactions(request, env, url);
    }

    // Selain /api, sajikan file statis (SPA React).
    return env.ASSETS.fetch(request);
  },
};
