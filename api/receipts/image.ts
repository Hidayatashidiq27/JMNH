// GET /api/receipts/image?id=... — signed URL sementara (admin). Vercel (mandiri).

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

    const id = qId(req);
    if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }

    const r = await fetch(`${url}/rest/v1/receipts?id=eq.${encodeURIComponent(id)}&select=storage_path`, { headers: sbH(key) });
    const rows = r.ok ? await r.json() : [];
    const path = rows[0]?.storage_path;
    if (!path) { res.status(404).json({ error: 'Gambar tidak ditemukan.' }); return; }

    const signRes = await fetch(`${url}/storage/v1/object/sign/receipts/${path}`, {
      method: 'POST',
      headers: { ...stH(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    if (!signRes.ok) { res.status(502).json({ error: 'Gagal membuat URL gambar.', detail: (await signRes.text()).slice(0, 300) }); return; }
    const data = await signRes.json();
    res.status(200).json({ url: `${url}/storage/v1${data.signedURL}` });
  } catch (e: any) {
    res.status(500).json({ error: 'Terjadi kesalahan di server.', detail: String(e?.message || e).slice(0, 300) });
  }
}
