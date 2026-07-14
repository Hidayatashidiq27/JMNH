// Entry point Cloudflare Worker.
// - Permintaan ke /api/scan ditangani di server (aman, key tidak ke browser).
// - Permintaan lain disajikan sebagai aset statis (hasil build Vite di ./dist).

import { runScan } from "./gemini";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/scan") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return runScan(request, env);
    }

    // Selain /api, sajikan file statis (SPA React).
    return env.ASSETS.fetch(request);
  },
};
