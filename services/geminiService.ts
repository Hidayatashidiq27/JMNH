// Frontend TIDAK lagi memanggil Gemini langsung — kunci API tetap aman di server.
// Kita panggil Cloudflare Function kita sendiri di /api/scan.

export const scanReceipt = async (
  base64Image: string,
  mimeType: string = "image/jpeg",
) => {
  const response = await fetch("/api/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": sessionStorage.getItem("admin_pass") || "",
    },
    body: JSON.stringify({ image: base64Image, mimeType }),
  });

  if (!response.ok) {
    let message = `Gagal memindai gambar (kode ${response.status}).`;
    try {
      const errData = await response.json();
      console.error("Detail error dari server /api/scan:", errData);
      if (errData?.error) message = errData.error;
      if (errData?.detail) message += ` (${String(errData.detail).slice(0, 200)})`;
    } catch {
      // abaikan jika body bukan JSON
    }
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
};
