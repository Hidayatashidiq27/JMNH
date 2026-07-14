// Lapisan data: menghubungkan Worker ke Supabase (REST/PostgREST).
// SERVICE ROLE KEY hanya ada di server (secret Cloudflare), tidak pernah ke browser.

const jsonResp = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const sbHeaders = (env: any) => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
});

const sbUrl = (env: any, path: string) => `${env.SUPABASE_URL}/rest/v1/${path}`;

const isAdmin = (request: Request, env: any): boolean => {
  const pass = request.headers.get("x-admin-password") || "";
  return Boolean(env.ADMIN_PASSWORD) && pass === env.ADMIN_PASSWORD;
};

// Ubah baris DB menjadi bentuk Transaction yang dipakai frontend.
const mapRow = (r: any) => ({
  id: r.id,
  date: r.date,
  activity: r.activity,
  amount: Number(r.amount),
  type: r.type,
  category: r.category,
});

// Ambil hanya kolom yang boleh ditulis (buang id/created_at, cegah data liar).
const sanitize = (t: any) => ({
  date: t?.date,
  activity: t?.activity,
  amount: Number(t?.amount) || 0,
  type: t?.type === "IN" ? "IN" : "OUT",
  category: t?.category || "Umum",
});

// POST /api/login  -> memvalidasi password admin.
export const handleLogin = async (request: Request, env: any): Promise<Response> => {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* abaikan */
  }
  if (env.ADMIN_PASSWORD && body?.password === env.ADMIN_PASSWORD) {
    return jsonResp({ ok: true });
  }
  return jsonResp({ error: "Password admin salah." }, 401);
};

// /api/transactions  -> GET (publik), POST/PUT/DELETE (admin).
export const handleTransactions = async (request: Request, env: any, url: URL): Promise<Response> => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResp({ error: "Supabase belum dikonfigurasi di server (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." }, 500);
  }

  const method = request.method;

  // --- Baca: terbuka untuk publik ---
  if (method === "GET") {
    const res = await fetch(sbUrl(env, "transactions?select=*&order=date.asc"), { headers: sbHeaders(env) });
    if (!res.ok) {
      return jsonResp({ error: "Gagal memuat data.", detail: (await res.text()).slice(0, 300) }, 502);
    }
    const rows = await res.json();
    return jsonResp((rows as any[]).map(mapRow));
  }

  // --- Tulis: wajib admin ---
  if (!isAdmin(request, env)) {
    return jsonResp({ error: "Akses ditolak. Silakan login admin terlebih dahulu." }, 401);
  }

  if (method === "POST") {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResp({ error: "Body permintaan tidak valid." }, 400);
    }
    const isArray = Array.isArray(body);
    const payload = (isArray ? body : [body]).map(sanitize);
    const res = await fetch(sbUrl(env, "transactions"), {
      method: "POST",
      headers: { ...sbHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return jsonResp({ error: "Gagal menyimpan data.", detail: (await res.text()).slice(0, 300) }, 502);
    }
    const inserted = ((await res.json()) as any[]).map(mapRow);
    return jsonResp(isArray ? inserted : inserted[0], 201);
  }

  const id = url.searchParams.get("id");

  if (method === "PUT" || method === "PATCH") {
    if (!id) return jsonResp({ error: "Parameter id wajib diisi." }, 400);
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResp({ error: "Body permintaan tidak valid." }, 400);
    }
    const res = await fetch(sbUrl(env, `transactions?id=eq.${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: { ...sbHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(sanitize(body)),
    });
    if (!res.ok) {
      return jsonResp({ error: "Gagal mengubah data.", detail: (await res.text()).slice(0, 300) }, 502);
    }
    const updated = ((await res.json()) as any[]).map(mapRow);
    return jsonResp(updated[0] || null);
  }

  if (method === "DELETE") {
    if (!id) return jsonResp({ error: "Parameter id wajib diisi." }, 400);
    const res = await fetch(sbUrl(env, `transactions?id=eq.${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: sbHeaders(env),
    });
    if (!res.ok) {
      return jsonResp({ error: "Gagal menghapus data.", detail: (await res.text()).slice(0, 300) }, 502);
    }
    return jsonResp({ ok: true });
  }

  return jsonResp({ error: "Method tidak didukung." }, 405);
};
