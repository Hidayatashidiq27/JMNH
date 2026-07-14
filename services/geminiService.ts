
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Coba ulang otomatis saat model sedang sibuk (503) atau kena rate limit (429).
const generateWithRetry = async (params: any, maxRetries = 3) => {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      const code = error?.status ?? error?.error?.code ?? error?.code;
      const isRetryable = code === 503 || code === 429 || code === 500;
      if (!isRetryable || attempt === maxRetries) throw error;
      const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      console.warn(`Gemini sibuk (${code}). Mencoba lagi dalam ${delay / 1000}s... (percobaan ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }
  throw lastError;
};

export const scanReceipt = async (base64Image: string) => {
  try {
    const response = await generateWithRetry({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg"
            }
          },
          {
            text: `Analisis gambar laporan keuangan masjid ini dengan sangat teliti.
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
              4. Jika ada ketidakcocokan kecil karena kesalahan baca (OCR), sesuaikan angka agar perhitungan sinkron dengan 'Saldo Akhir' yang tertera di kertas.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
                  activity: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  type: { type: Type.STRING, enum: ["IN", "OUT"] }
                },
                required: ["date", "activity", "amount", "type"]
              }
            },
            startingBalance: { type: Type.NUMBER },
            endingBalance: { type: Type.NUMBER }
          },
          required: ["transactions", "startingBalance", "endingBalance"]
        }
      }
    });

    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error("AI Scan Error:", error);
    throw error;
  }
};
