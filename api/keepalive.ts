// GET /api/keepalive — dipanggil Vercel Cron harian agar Supabase tetap dianggap
// "aktif" (mencegah auto-pause 7 hari pada plan gratis). Hanya membaca 1 baris.
export default async function handler(_req: any, res: any) {
  try {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) {
      res.status(500).json({ ok: false, error: 'Supabase belum dikonfigurasi.' });
      return;
    }
    const r = await fetch(`${url}/rest/v1/transactions?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    res.status(200).json({ ok: r.ok, status: r.status, at: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e).slice(0, 200) });
  }
}
