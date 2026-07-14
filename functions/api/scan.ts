// Cloudflare Pages Function: POST /api/scan
// Memakai logika bersama dari worker/gemini.ts. (Hanya dipakai jika Anda deploy
// sebagai Cloudflare Pages. Untuk deploy sebagai Worker, lihat worker/index.ts.)
import { runScan } from "../../worker/gemini";

export const onRequestPost = async (context: any): Promise<Response> =>
  runScan(context.request, context.env);
