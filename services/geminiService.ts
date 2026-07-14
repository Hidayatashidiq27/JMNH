// Frontend TIDAK lagi memanggil Gemini langsung — kunci API tetap aman di server.
// Kita panggil Cloudflare Function kita sendiri di /api/scan.

export const scanReceipt = async (
  base64Image: string,
  mimeType: string = "image/jpeg",
) => {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image, mimeType }),
  });

  if (!response.ok) {
    let message = "Gagal memindai gambar.";
    try {
      const errData = await response.json();
      if (errData?.error) message = errData.error;
    } catch {
      // abaikan jika body bukan JSON
    }
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
};
