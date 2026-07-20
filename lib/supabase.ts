// Helper bersama untuk Vercel Serverless Functions (Node, region AS).
// Memakai service_role key Supabase dari environment variable (rahasia server).

export const serverEnv = () => ({
  url: process.env.SUPABASE_URL || '',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
});

// Bungkus handler agar error runtime tampil sebagai JSON (bukan crash 500).
export const withErrors = (handler: (req: any, res: any) => any) => async (req: any, res: any) => {
  try {
    await handler(req, res);
  } catch (e: any) {
    res.status(500).json({
      error: 'Terjadi kesalahan di server.',
      detail: String(e?.message || e).slice(0, 300),
    });
  }
};

export const sbHeaders = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
});

export const storageHeaders = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
});

export const isAdmin = (req: any): boolean => {
  const { adminPassword } = serverEnv();
  const pass = (req.headers?.['x-admin-password'] as string) || '';
  return Boolean(adminPassword) && pass === adminPassword;
};

export const readBody = (req: any): any => {
  let b = req.body;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch {
      b = {};
    }
  }
  return b || {};
};

export const queryId = (req: any): string => {
  const id = req.query?.id;
  return Array.isArray(id) ? id[0] : (id || '');
};

export const mapRow = (r: any) => ({
  id: r.id,
  date: r.date,
  activity: r.activity,
  amount: Number(r.amount),
  type: r.type,
  category: r.category,
});

export const sanitize = (t: any) => ({
  date: t?.date,
  activity: t?.activity,
  amount: Number(t?.amount) || 0,
  type: t?.type === 'IN' ? 'IN' : 'OUT',
  category: t?.category || 'Umum',
});
