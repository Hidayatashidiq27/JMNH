// GET /api/health — penanda versi + cek environment variable (tanpa bocorkan nilai).
import { serverEnv, withErrors } from '../lib/supabase';

export default withErrors((_req: any, res: any) => {
  const { url, key, adminPassword, geminiKey } = serverEnv();
  res.status(200).json({
    ok: true,
    platform: 'vercel',
    version: 'vercel-2',
    env: {
      SUPABASE_URL: Boolean(url),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(key),
      ADMIN_PASSWORD: Boolean(adminPassword),
      GEMINI_API_KEY: Boolean(geminiKey),
    },
  });
});
