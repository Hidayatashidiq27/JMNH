
import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Trash2, X, Loader2, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import * as dataService from '../services/dataService';
import type { Receipt } from '../services/dataService';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ReceiptGallery: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dataService.getReceipts();
      setReceipts(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar gambar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleView = async (id: string) => {
    setViewLoading(true);
    setViewUrl(null);
    try {
      const url = await dataService.getReceiptImageUrl(id);
      setViewUrl(url);
    } catch (err: any) {
      setError(err?.message || 'Gagal membuka gambar.');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await dataService.deleteReceipt(id);
      setReceipts(prev => prev.filter(r => r.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus gambar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h4 className="font-semibold text-slate-800 text-sm md:text-base flex items-center gap-2">
          <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
          Bukti Foto Upload
        </h4>
        <button
          onClick={load}
          className="text-[10px] md:text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Muat ulang
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-2" />
          <p className="text-sm">Memuat...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm">Belum ada gambar yang diupload.</p>
          <p className="text-xs text-slate-400 mt-1">Gambar akan tersimpan otomatis saat Anda scan struk.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {receipts.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50/50 transition-colors">
              <button
                onClick={() => handleView(r.id)}
                className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 hover:bg-emerald-100 transition-colors"
                title="Lihat gambar"
              >
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{formatDateTime(r.uploaded_at)}</span>
                </div>
                <button
                  onClick={() => handleView(r.id)}
                  className="mt-1 text-[11px] md:text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Klik untuk lihat gambar
                </button>
              </div>

              {confirmDeleteId === r.id ? (
                <div className="flex flex-col gap-1 items-center bg-red-50 p-1 rounded-lg flex-shrink-0">
                  <button
                    disabled={busy}
                    onClick={() => handleDelete(r.id)}
                    className="px-2 py-1 bg-red-500 text-white text-[10px] rounded hover:bg-red-600 font-bold disabled:opacity-50"
                  >
                    Hapus?
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] rounded hover:bg-slate-300 font-bold"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(r.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Modal lihat gambar */}
      {(viewUrl || viewLoading) && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
          onClick={() => { setViewUrl(null); setViewLoading(false); }}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setViewUrl(null); setViewLoading(false); }}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-sm"
            >
              <X className="w-5 h-5" /> Tutup
            </button>
            {viewLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Memuat gambar...</p>
              </div>
            ) : viewUrl ? (
              <img
                src={viewUrl}
                alt="Bukti struk"
                className="w-full max-h-[80vh] object-contain rounded-lg bg-white"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptGallery;
