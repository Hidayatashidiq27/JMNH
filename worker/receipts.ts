// Penanganan gambar struk: menyimpan ke Supabase Storage (bucket privat),
// mendaftar, membuat signed URL (sementara), dan menghapus. Semua KHUSUS ADMIN.
import { scanImage } from "./gemini";
import { isAdmin, jsonResp, sbHeaders, sbUrl } from "./data";

const BUCKET = "receipts";

const storageHeaders = (env: any) => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
});

// base64 -> byte array (untuk upload biner ke Storage).
const base64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const hasSupabase = (env: any) => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

// Simpan gambar ke Storage + catat di tabel receipts. Best-effort.
const saveReceipt = async (env: any, image: string, mimeType: string): Promise<void> => {
  const ext = (mimeType || "").includes("png") ? "png" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const up = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...storageHeaders(env), "Content-Type": mimeType || "image/jpeg" },
    body: base64ToBytes(image),
  });
  if (!up.ok) throw new Error(`Upload storage gagal: ${up.status}`);

  await fetch(sbUrl(env, "receipts"), {
    method: "POST",
    headers: { ...sbHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify({ storage_path: path, mime_type: mimeType || "image/jpeg" }),
  });
};

// POST /api/scan  -> scan Gemini (KHUSUS ADMIN) + simpan gambar yang diupload.
export const handleScan = async (request: Request, env: any): Promise<Response> => {
  if (!isAdmin(request, env)) {
    return jsonResp({ error: "Akses ditolak. Silakan login admin terlebih dahulu." }, 401);
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return jsonResp({ error: "Body permintaan tidak valid." }, 400);
  }

  const { image, mimeType } = payload || {};
  const result = await scanImage({ image, mimeType, apiKey: env.GEMINI_API_KEY });

  // Simpan gambar hanya jika scan sukses (best-effort; jangan gagalkan scan bila simpan error).
  if (result.status === 200 && image && hasSupabase(env)) {
    try {
      await saveReceipt(env, image, mimeType || "image/jpeg");
    } catch (e) {
      console.error("Gagal menyimpan gambar struk:", e);
    }
  }

  return jsonResp(result.body, result.status);
};

// /api/receipts  -> GET daftar (admin), DELETE (admin).
export const handleReceipts = async (request: Request, env: any, url: URL): Promise<Response> => {
  if (!isAdmin(request, env)) {
    return jsonResp({ error: "Akses ditolak. Login admin diperlukan." }, 401);
  }
  if (!hasSupabase(env)) {
    return jsonResp({ error: "Supabase belum dikonfigurasi di server." }, 500);
  }

  if (request.method === "GET") {
    const res = await fetch(sbUrl(env, "receipts?select=id,uploaded_at,mime_type&order=uploaded_at.desc"), {
      headers: sbHeaders(env),
    });
    if (!res.ok) {
      return jsonResp({ error: "Gagal memuat daftar gambar.", detail: (await res.text()).slice(0, 300) }, 502);
    }
    return jsonResp(await res.json());
  }

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return jsonResp({ error: "Parameter id wajib diisi." }, 400);

    // Ambil storage_path lalu hapus file dari Storage.
    const r = await fetch(sbUrl(env, `receipts?id=eq.${encodeURIComponent(id)}&select=storage_path`), {
      headers: sbHeaders(env),
    });
    const rows = r.ok ? await r.json() : [];
    const path = rows[0]?.storage_path;
    if (path) {
      await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: "DELETE",
        headers: storageHeaders(env),
      });
    }

    const del = await fetch(sbUrl(env, `receipts?id=eq.${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: sbHeaders(env),
    });
    if (!del.ok) {
      return jsonResp({ error: "Gagal menghapus gambar.", detail: (await del.text()).slice(0, 300) }, 502);
    }
    return jsonResp({ ok: true });
  }

  return jsonResp({ error: "Method tidak didukung." }, 405);
};

// GET /api/receipts/image?id=...  -> signed URL sementara (admin).
export const handleReceiptImage = async (request: Request, env: any, url: URL): Promise<Response> => {
  if (!isAdmin(request, env)) {
    return jsonResp({ error: "Akses ditolak. Login admin diperlukan." }, 401);
  }
  if (!hasSupabase(env)) {
    return jsonResp({ error: "Supabase belum dikonfigurasi di server." }, 500);
  }

  const id = url.searchParams.get("id");
  if (!id) return jsonResp({ error: "Parameter id wajib diisi." }, 400);

  const r = await fetch(sbUrl(env, `receipts?id=eq.${encodeURIComponent(id)}&select=storage_path`), {
    headers: sbHeaders(env),
  });
  const rows = r.ok ? await r.json() : [];
  const path = rows[0]?.storage_path;
  if (!path) return jsonResp({ error: "Gambar tidak ditemukan." }, 404);

  // Signed URL berlaku 1 jam.
  const signRes = await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...storageHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!signRes.ok) {
    return jsonResp({ error: "Gagal membuat URL gambar.", detail: (await signRes.text()).slice(0, 300) }, 502);
  }
  const data: any = await signRes.json();
  return jsonResp({ url: `${env.SUPABASE_URL}/storage/v1${data.signedURL}` });
};
