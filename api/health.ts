// GET /api/health — penanda versi/kesehatan (Vercel).
export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    platform: 'vercel',
    version: 'vercel-1',
    features: ['scan', 'login', 'transactions', 'receipts', 'monthly-filter', 'pwa'],
  });
}
