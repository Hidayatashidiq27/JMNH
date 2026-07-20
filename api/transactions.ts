// /api/transactions — GET (publik), POST/PUT/DELETE (admin). Vercel.
import { serverEnv, sbHeaders, isAdmin, readBody, queryId, mapRow, sanitize } from '../lib/supabase';

export default async function handler(req: any, res: any) {
  const { url, key } = serverEnv();
  if (!url || !key) {
    res.status(500).json({ error: 'Supabase belum dikonfigurasi di server (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
    return;
  }
  const base = `${url}/rest/v1/transactions`;

  // Baca: publik
  if (req.method === 'GET') {
    const r = await fetch(`${base}?select=*&order=date.asc`, { headers: sbHeaders(key) });
    if (!r.ok) {
      res.status(502).json({ error: 'Gagal memuat data.', detail: (await r.text()).slice(0, 300) });
      return;
    }
    const rows = await r.json();
    res.status(200).json(rows.map(mapRow));
    return;
  }

  // Tulis: admin
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Akses ditolak. Silakan login admin terlebih dahulu.' });
    return;
  }

  if (req.method === 'POST') {
    const body = readBody(req);
    const isArray = Array.isArray(body);
    const payload = (isArray ? body : [body]).map(sanitize);
    const r = await fetch(base, {
      method: 'POST',
      headers: { ...sbHeaders(key), Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      res.status(502).json({ error: 'Gagal menyimpan data.', detail: (await r.text()).slice(0, 300) });
      return;
    }
    const inserted = (await r.json()).map(mapRow);
    res.status(201).json(isArray ? inserted : inserted[0]);
    return;
  }

  const id = queryId(req);

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }
    const body = readBody(req);
    const r = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...sbHeaders(key), Prefer: 'return=representation' },
      body: JSON.stringify(sanitize(body)),
    });
    if (!r.ok) {
      res.status(502).json({ error: 'Gagal mengubah data.', detail: (await r.text()).slice(0, 300) });
      return;
    }
    const updated = (await r.json()).map(mapRow);
    res.status(200).json(updated[0] || null);
    return;
  }

  if (req.method === 'DELETE') {
    if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }
    const r = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: sbHeaders(key) });
    if (!r.ok) {
      res.status(502).json({ error: 'Gagal menghapus data.', detail: (await r.text()).slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method tidak didukung.' });
}
