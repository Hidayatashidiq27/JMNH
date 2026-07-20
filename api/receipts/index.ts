// /api/receipts — GET daftar (admin), DELETE (admin). Vercel.
import { serverEnv, sbHeaders, storageHeaders, isAdmin, queryId } from '../../lib/supabase';

export default async function handler(req: any, res: any) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Akses ditolak. Login admin diperlukan.' });
    return;
  }
  const { url, key } = serverEnv();
  if (!url || !key) {
    res.status(500).json({ error: 'Supabase belum dikonfigurasi di server.' });
    return;
  }

  if (req.method === 'GET') {
    const r = await fetch(`${url}/rest/v1/receipts?select=id,uploaded_at,mime_type&order=uploaded_at.desc`, {
      headers: sbHeaders(key),
    });
    if (!r.ok) {
      res.status(502).json({ error: 'Gagal memuat daftar gambar.', detail: (await r.text()).slice(0, 300) });
      return;
    }
    res.status(200).json(await r.json());
    return;
  }

  if (req.method === 'DELETE') {
    const id = queryId(req);
    if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }
    const g = await fetch(`${url}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}&select=storage_path`, {
      headers: sbHeaders(key),
    });
    const rows = g.ok ? await g.json() : [];
    const path = rows[0]?.storage_path;
    if (path) {
      await fetch(`${url}/storage/v1/object/receipts/${path}`, { method: 'DELETE', headers: storageHeaders(key) });
    }
    const d = await fetch(`${url}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: sbHeaders(key),
    });
    if (!d.ok) {
      res.status(502).json({ error: 'Gagal menghapus gambar.', detail: (await d.text()).slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method tidak didukung.' });
}
