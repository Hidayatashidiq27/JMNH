// GET /api/receipts/image?id=... — signed URL sementara (admin). Vercel.
import { serverEnv, sbHeaders, storageHeaders, isAdmin, queryId, withErrors } from '../../lib/supabase';

export default withErrors(async (req: any, res: any) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Akses ditolak. Login admin diperlukan.' });
    return;
  }
  const { url, key } = serverEnv();
  if (!url || !key) {
    res.status(500).json({ error: 'Supabase belum dikonfigurasi di server.' });
    return;
  }

  const id = queryId(req);
  if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }

  const r = await fetch(`${url}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}&select=storage_path`, {
    headers: sbHeaders(key),
  });
  const rows = r.ok ? await r.json() : [];
  const path = rows[0]?.storage_path;
  if (!path) { res.status(404).json({ error: 'Gambar tidak ditemukan.' }); return; }

  const signRes = await fetch(`${url}/storage/v1/object/sign/receipts/${path}`, {
    method: 'POST',
    headers: { ...storageHeaders(key), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!signRes.ok) {
    res.status(502).json({ error: 'Gagal membuat URL gambar.', detail: (await signRes.text()).slice(0, 300) });
    return;
  }
  const data = await signRes.json();
  res.status(200).json({ url: `${url}/storage/v1${data.signedURL}` });
});
