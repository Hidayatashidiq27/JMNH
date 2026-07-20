// POST /api/login — validasi password admin (Vercel).
import { serverEnv, readBody } from '../lib/supabase';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { adminPassword } = serverEnv();
  const { password } = readBody(req);
  if (adminPassword && password === adminPassword) {
    res.status(200).json({ ok: true });
    return;
  }
  res.status(401).json({ error: 'Password admin salah.' });
}
