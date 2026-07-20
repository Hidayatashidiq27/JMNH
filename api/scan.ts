// POST /api/scan — scan Gemini (KHUSUS ADMIN) + simpan gambar. Vercel (mandiri, region AS).
import { randomUUID } from 'node:crypto';

const MODEL = 'gemini-3-flash-preview';
const PROMPT = `Analisis gambar laporan keuangan masjid ini dengan sangat teliti.
Aturan Tata Letak:
- Kolom Kiri: Pemasukan (Infaq, Shodaqoh, Hibah, dll).
- Kolom Kanan: Pengeluaran (Listrik, Operasional, Marbot, dll).
- Saldo Awal: Biasanya di kanan atas atau awal baris.
- Saldo Akhir: Biasanya di kanan bawah setelah total.

Instruksi Khusus Tanggal:
- Temukan tanggal untuk setiap baris transaksi.
- Jika di baris tidak ada tanggal, gunakan tanggal dari header laporan atau tanggal transaksi sebelumnya.
- Pahami format Indonesia (misal: '12 Mei 2024', '12/05/24', '12-05-2024').
- Output harus selalu dalam format YYYY-MM-DD.

Tugas:
1. Ekstrak semua transaksi individu.
2. Ekstrak 'startingBalance' dan 'endingBalance'.
3. Pastikan: startingBalance + total(IN) - total(OUT) = endingBalance.
4. Jika ada ketidakcocokan kecil karena kesalahan baca (OCR), sesuaikan angka agar perhitungan sinkron dengan 'Saldo Akhir' yang tertera di kertas.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transactions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          date: { type: 'STRING', description: 'Format YYYY-MM-DD' },
          activity: { type: 'STRING' },
          amount: { type: 'NUMBER' },
          type: { type: 'STRING', enum: ['IN', 'OUT'] },
        },
        required: ['date', 'activity', 'amount', 'type'],
      },
    },
    startingBalance: { type: 'NUMBER' },
    endingBalance: { type: 'NUMBER' },
  },
  required: ['transactions', 'startingBalance', 'endingBalance'],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function scanImage(image: string, mimeType: string, apiKey: string): Promise<{ status: number; body: any }> {
  if (!apiKey) return { status: 500, body: { error: 'GEMINI_API_KEY belum diset di environment server.' } };
  if (!image) return { status: 400, body: { error: 'Data gambar tidak ditemukan.' } };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ parts: [{ inline_data: { mime_type: mimeType || 'image/jpeg', data: image } }, { text: PROMPT }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
  };

  const maxRetries = 3;
  let lastStatus = 502;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let r: Response;
    try {
      r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    } catch (e: any) {
      return { status: 502, body: { error: 'Gagal menghubungi server AI.', detail: String(e?.message || e).slice(0, 300) } };
    }
    if (r.ok) {
      const data: any = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      let parsed: any;
      try { parsed = JSON.parse(text); } catch { parsed = {}; }
      return { status: 200, body: parsed };
    }
    lastStatus = r.status;
    const retryable = r.status === 503 || r.status === 429 || r.status === 500;
    if (!retryable || attempt === maxRetries) {
      const errText = await r.text().catch(() => '');
      return {
        status: r.status === 503 || r.status === 429 ? r.status : r.status >= 500 ? 502 : r.status,
        body: {
          error: r.status === 503 || r.status === 429
            ? 'Server AI sedang sibuk. Silakan coba lagi beberapa saat lagi.'
            : `Gagal memproses gambar di server AI (kode ${r.status}).`,
          detail: errText.slice(0, 500),
        },
      };
    }
    await sleep(1000 * Math.pow(2, attempt));
  }
  return { status: lastStatus, body: { error: 'Server AI sedang sibuk. Silakan coba lagi.' } };
}

async function saveReceipt(url: string, key: string, image: string, mimeType: string) {
  const ext = (mimeType || '').includes('png') ? 'png' : 'jpg';
  const path = `${randomUUID()}.${ext}`;
  const up = await fetch(`${url}/storage/v1/object/receipts/${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': mimeType || 'image/jpeg' },
    body: Buffer.from(image, 'base64'),
  });
  if (!up.ok) throw new Error(`Upload storage gagal: ${up.status}`);
  await fetch(`${url}/rest/v1/receipts`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ storage_path: path, mime_type: mimeType || 'image/jpeg' }),
  });
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const pass = (req.headers?.['x-admin-password'] as string) || '';
    if (!adminPassword || pass !== adminPassword) {
      res.status(401).json({ error: 'Akses ditolak. Silakan login admin terlebih dahulu.' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { image, mimeType } = body || {};

    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const result = await scanImage(image, mimeType || 'image/jpeg', process.env.GEMINI_API_KEY || '');

    if (result.status === 200 && image && url && key) {
      try { await saveReceipt(url, key, image, mimeType || 'image/jpeg'); } catch (e) { console.error('Simpan gambar gagal:', e); }
    }

    res.status(result.status).json(result.body);
  } catch (e: any) {
    res.status(500).json({ error: 'Terjadi kesalahan di server.', detail: String(e?.message || e).slice(0, 300) });
  }
}
