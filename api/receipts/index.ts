// /api/receipts — GET daftar (admin), DELETE (admin). Vercel (mandiri).

const cfg = () => ({
  url: process.env.SUPABASE_URL || '',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
});
const sbH = (k: string) => ({ apikey: k, Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' });
const stH = (k: string) => ({ apikey: k, Authorization: `Bearer ${k}` });
const isAdmin = (req: any) => {
  const { adminPassword } = cfg();
  const p = (req.headers?.['x-admin-password'] as string) || '';
  return Boolean(adminPassword) && p === adminPassword;
};
const qId = (req: any) => {
  const id = req.query?.id;
  return Array.isArray(id) ? id[0] : (id || '');
};

export default async function handler(req: any, res: any) {
  try {
    if (!isAdmin(req)) { res.status(401).json({ error: 'Akses ditolak. Login admin diperlukan.' }); return; }
    const { url, key } = cfg();
    if (!url || !key) { res.status(500).json({ error: 'Supabase belum dikonfigurasi di server.' }); return; }

    if (req.method === 'GET') {
      const r = await fetch(`${url}/rest/v1/receipts?select=id,uploaded_at,mime_type&order=uploaded_at.desc`, { headers: sbH(key) });
      if (!r.ok) { res.status(502).json({ error: 'Gagal memuat daftar gambar.', detail: (await r.text()).slice(0, 300) }); return; }
      res.status(200).json(await r.json());
      return;
    }

    if (req.method === 'DELETE') {
      const id = qId(req);
      if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }
      const g = await fetch(`${url}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}&select=storage_path`, { headers: sbH(key) });
      const rows = g.ok ? await g.json() : [];
      const path = rows[0]?.storage_path;
      if (path) {
        await fetch(`${url}/storage/v1/object/receipts/${path}`, { method: 'DELETE', headers: stH(key) });
      }
      const d = await fetch(`${url}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: sbH(key) });
      if (!d.ok) { res.status(502).json({ error: 'Gagal menghapus gambar.', detail: (await d.text()).slice(0, 300) }); return; }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method tidak didukung.' });
  } catch (e: any) {
    res.status(500).json({ error: 'Terjadi kesalahan di server.', detail: String(e?.message || e).slice(0, 300) });
  }
}
