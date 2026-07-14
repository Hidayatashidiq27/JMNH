// Vercel Serverless Function: POST /api/scan
// Berjalan di region AS (didukung Gemini). GEMINI_API_KEY diambil dari
// Environment Variables Vercel — tidak pernah dikirim ke browser.
import { scanImage } from "../worker/gemini";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Vercel biasanya sudah mem-parse JSON body; jaga-jaga bila masih string.
  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  payload = payload || {};

  const { status, body } = await scanImage({
    image: payload.image,
    mimeType: payload.mimeType,
    apiKey: process.env.GEMINI_API_KEY,
  });

  res.status(status).json(body);
}
