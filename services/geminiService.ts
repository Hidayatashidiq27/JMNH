
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const scanReceipt = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
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
