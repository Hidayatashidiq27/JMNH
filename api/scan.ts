// POST /api/scan — scan Gemini (KHUSUS ADMIN) + simpan gambar ke Supabase Storage.
// Berjalan di region AS Vercel (didukung Gemini), jadi tidak kena batasan lokasi.
import { randomUUID } from 'node:crypto';
import { scanImage } from '../worker/gemini';
import { serverEnv, isAdmin, readBody, sbHeaders, storageHeaders, withErrors } from '../lib/supabase';

async function saveReceipt(url: string, key: string, image: string, mimeType: string) {
  const ext = (mimeType || '').includes('png') ? 'png' : 'jpg';
  const path = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(image, 'base64');
  const up = await fetch(`${url}/storage/v1/object/receipts/${path}`, {
    method: 'POST',
    headers: { ...storageHeaders(key), 'Content-Type': mimeType || 'image/jpeg' },
    body: bytes,
  });
  if (!up.ok) throw new Error(`Upload storage gagal: ${up.status}`);
  await fetch(`${url}/rest/v1/receipts`, {
    method: 'POST',
    headers: { ...sbHeaders(key), Prefer: 'return=minimal' },
    body: JSON.stringify({ storage_path: path, mime_type: mimeType || 'image/jpeg' }),
  });
}

export default withErrors(async (req: any, res: any) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Akses ditolak. Silakan login admin terlebih dahulu.' });
    return;
  }

  const { url, key, geminiKey } = serverEnv();
  const { image, mimeType } = readBody(req);

  const result = await scanImage({ image, mimeType, apiKey: geminiKey });

  if (result.status === 200 && image && url && key) {
    try {
      await saveReceipt(url, key, image, mimeType || 'image/jpeg');
    } catch (e) {
      console.error('Gagal menyimpan gambar struk:', e);
    }
  }

  res.status(result.status).json(result.body);
});
