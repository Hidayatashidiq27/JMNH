// Logika pemanggilan Gemini di SISI SERVER (dipakai bersama oleh Vercel Function,
// Cloudflare Worker, dan Cloudflare Pages Function). GEMINI_API_KEY tidak pernah
// dikirim ke browser.

const MODEL = "gemini-3-flash-preview";

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

// Skema respons dalam format REST Gemini (tipe huruf besar).
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    transactions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING", description: "Format YYYY-MM-DD" },
          activity: { type: "STRING" },
          amount: { type: "NUMBER" },
          type: { type: "STRING", enum: ["IN", "OUT"] },
        },
        required: ["date", "activity", "amount", "type"],
      },
    },
    startingBalance: { type: "NUMBER" },
    endingBalance: { type: "NUMBER" },
  },
  required: ["transactions", "startingBalance", "endingBalance"],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ScanInput {
  image?: string;
  mimeType?: string;
  apiKey?: string;
}

export interface ScanOutput {
  status: number;
  body: any;
}

// Inti logika, tanpa ketergantungan platform. Mengembalikan { status, body }.
export const scanImage = async ({ image, mimeType, apiKey }: ScanInput): Promise<ScanOutput> => {
  if (!apiKey) {
    return { status: 500, body: { error: "GEMINI_API_KEY belum diset di environment server." } };
  }
  if (!image) {
    return { status: 400, body: { error: "Data gambar tidak ditemukan." } };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType || "image/jpeg", data: image } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  // Coba ulang otomatis saat model sibuk (503) atau kena rate limit (429/500).
  const maxRetries = 3;
  let lastStatus = 502;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch (e: any) {
      return {
        status: 502,
        body: { error: "Gagal menghubungi server AI.", detail: String(e?.message || e).slice(0, 300) },
      };
    }

    if (res.ok) {
      const data: any = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {};
      }
      return { status: 200, body: parsed };
    }

    lastStatus = res.status;
    const retryable = res.status === 503 || res.status === 429 || res.status === 500;
    if (!retryable || attempt === maxRetries) {
      const errText = await res.text().catch(() => "");
      return {
        status: res.status === 503 || res.status === 429 ? res.status : res.status >= 500 ? 502 : res.status,
        body: {
          error:
            res.status === 503 || res.status === 429
              ? "Server AI sedang sibuk. Silakan coba lagi beberapa saat lagi."
              : `Gagal memproses gambar di server AI (kode ${res.status}).`,
          detail: errText.slice(0, 500),
        },
      };
    }
    await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
  }

  return { status: lastStatus, body: { error: "Server AI sedang sibuk. Silakan coba lagi." } };
};

// Pembungkus untuk platform berbasis Web Request/Response (Cloudflare).
export const runScan = async (request: Request, env: any): Promise<Response> => {
  let payload: ScanInput = {};
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body permintaan tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { status, body } = await scanImage({
    image: payload.image,
    mimeType: payload.mimeType,
    apiKey: env?.GEMINI_API_KEY,
  });

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};
