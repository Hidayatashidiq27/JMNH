// GET /api/health — penanda versi + cek env var (tanpa bocorkan nilai). Vercel (mandiri).
export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    platform: 'vercel',
    version: 'vercel-3',
    env: {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
    },
  });
}
