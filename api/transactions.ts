// /api/transactions — GET (publik), POST/PUT/DELETE (admin). Vercel (mandiri).

const cfg = () => ({
  url: process.env.SUPABASE_URL || '',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
});
const sbH = (k: string) => ({ apikey: k, Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' });
const isAdmin = (req: any) => {
  const { adminPassword } = cfg();
  const p = (req.headers?.['x-admin-password'] as string) || '';
  return Boolean(adminPassword) && p === adminPassword;
};
const readBody = (req: any) => {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  return b || {};
};
const qId = (req: any) => {
  const id = req.query?.id;
  return Array.isArray(id) ? id[0] : (id || '');
};
const mapRow = (r: any) => ({ id: r.id, date: r.date, activity: r.activity, amount: Number(r.amount), type: r.type, category: r.category });
const sanitize = (t: any) => ({
  date: t?.date,
  activity: t?.activity,
  amount: Number(t?.amount) || 0,
  type: t?.type === 'IN' ? 'IN' : 'OUT',
  category: t?.category || 'Umum',
});

export default async function handler(req: any, res: any) {
  try {
    const { url, key } = cfg();
    if (!url || !key) {
      res.status(500).json({ error: 'Supabase belum dikonfigurasi di server (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
      return;
    }
    const base = `${url}/rest/v1/transactions`;

    if (req.method === 'GET') {
      const r = await fetch(`${base}?select=*&order=date.asc`, { headers: sbH(key) });
      if (!r.ok) { res.status(502).json({ error: 'Gagal memuat data.', detail: (await r.text()).slice(0, 300) }); return; }
      res.status(200).json(((await r.json()) as any[]).map(mapRow));
      return;
    }

    if (!isAdmin(req)) { res.status(401).json({ error: 'Akses ditolak. Silakan login admin terlebih dahulu.' }); return; }

    if (req.method === 'POST') {
      const body = readBody(req);
      const isArray = Array.isArray(body);
      const payload = (isArray ? body : [body]).map(sanitize);
      const r = await fetch(base, { method: 'POST', headers: { ...sbH(key), Prefer: 'return=representation' }, body: JSON.stringify(payload) });
      if (!r.ok) { res.status(502).json({ error: 'Gagal menyimpan data.', detail: (await r.text()).slice(0, 300) }); return; }
      const inserted = ((await r.json()) as any[]).map(mapRow);
      res.status(201).json(isArray ? inserted : inserted[0]);
      return;
    }

    const id = qId(req);

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }
      const r = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...sbH(key), Prefer: 'return=representation' }, body: JSON.stringify(sanitize(readBody(req))),
      });
      if (!r.ok) { res.status(502).json({ error: 'Gagal mengubah data.', detail: (await r.text()).slice(0, 300) }); return; }
      const updated = ((await r.json()) as any[]).map(mapRow);
      res.status(200).json(updated[0] || null);
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }
      const r = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: sbH(key) });
      if (!r.ok) { res.status(502).json({ error: 'Gagal menghapus data.', detail: (await r.text()).slice(0, 300) }); return; }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method tidak didukung.' });
  } catch (e: any) {
    res.status(500).json({ error: 'Terjadi kesalahan di server.', detail: String(e?.message || e).slice(0, 300) });
  }
}
