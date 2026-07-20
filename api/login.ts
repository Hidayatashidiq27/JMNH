// POST /api/login — validasi password admin. Vercel (mandiri).
export default function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
    const password = (b || {}).password;
    if (adminPassword && password === adminPassword) { res.status(200).json({ ok: true }); return; }
    res.status(401).json({ error: 'Password admin salah.' });
  } catch (e: any) {
    res.status(500).json({ error: 'Terjadi kesalahan di server.', detail: String(e?.message || e).slice(0, 300) });
  }
}
