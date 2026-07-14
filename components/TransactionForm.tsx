
import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { scanReceipt } from '../services/geminiService';
import { PenSquare, Camera, Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onBulkAdd: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onBulkAdd }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'info' | 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    amount: '',
    type: 'IN' as TransactionType,
    category: 'Umum'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<Omit<Transaction, 'id'>[] | null>(null);

  const formatIDR = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity || !formData.amount) return;
    
    onAdd({
      date: formData.date,
      activity: formData.activity,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      activity: '',
      amount: '',
      type: 'IN',
      category: 'Umum'
    });
    
    setStatusMsg({ text: 'Data manual berhasil disimpan', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg({ text: 'AI sedang menganalisis baris masuk dan keluar...', type: 'info' });
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        if (base64) {
          const result = await scanReceipt(base64);
          
          if (result && result.transactions && result.transactions.length > 0) {
            const formatted = result.transactions.map((tr: any) => {
              const detectedType = tr.type === 'IN' || tr.type === 'Pemasukan' || tr.type === 'Masuk' ? 'IN' : 
                                   (tr.type === 'OUT' || tr.type === 'Pengeluaran' || tr.type === 'Keluar' ? 'OUT' : 'OUT');
              return {
                date: tr.date || new Date().toISOString().split('T')[0],
                activity: tr.activity,
                amount: tr.amount || 0,
                type: detectedType as TransactionType,
                category: 'Auto-Scan AI'
              };
            });

            setPreviewData(formatted);
            setStatusMsg({ 
              text: `Berhasil membaca ${formatted.length} baris. Silahkan periksa dan edit di bawah sebelum menyimpan.`, 
              type: 'success' 
            });
          } else {
            setStatusMsg({ text: 'AI tidak menemukan data transaksi yang valid pada gambar.', type: 'error' });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setStatusMsg({ text: 'Gagal memproses foto. Pastikan list laporan kas (masuk/keluar) terlihat jelas.', type: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditingPreview = (index: number, field: keyof Omit<Transaction, 'id'>, value: string) => {
    if (!previewData) return;
    const newData = [...previewData];
    if (field === 'amount') {
      newData[index] = { ...newData[index], [field]: parseFloat(value) || 0 };
    } else {
      newData[index] = { ...newData[index], [field]: value };
    }
    setPreviewData(newData);
  };

  const handleDeletePreviewItem = (index: number) => {
    if (!previewData) return;
    const newData = [...previewData];
    newData.splice(index, 1);
    setPreviewData(newData);
  };

  const handleSavePreview = () => {
    if (!previewData) return;
    onBulkAdd(previewData);
    setPreviewData(null);
    setStatusMsg({ text: 'Semua data hasil scan berhasil disimpan!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h4 className="text-slate-800 font-semibold flex items-center gap-2">
            <span className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <PenSquare className="w-5 h-5" />
            </span>
            Input Kas Masjid
          </h4>
          <p className="text-xs text-slate-500 mt-1">Manual atau gunakan AI Scan untuk otomatisasi kolom kiri (Masuk) & kanan (Keluar)</p>
        </div>
        <div className="relative group">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden" 
          />
          <button 
            type="button"
            disabled={loading || previewData !== null}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg hover:shadow-emerald-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses Baris...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Camera className="w-5 h-5" /> Auto-Scan AI (Kiri-Kanan)
              </span>
            )}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-bounce-short ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
          'bg-blue-50 text-blue-700 border border-blue-100'
        }`}>
          <span>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             statusMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
             <Info className="w-5 h-5" />}
          </span>
          {statusMsg.text}
        </div>
      )}

      {/* Form Manual - Hidden if Preview is active */}
      {!previewData && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kegiatan</label>
            <input 
              type="text" 
              placeholder="Keterangan..."
              value={formData.activity}
              onChange={(e) => setFormData({...formData, activity: e.target.value})}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nominal (Rp)</label>
            <input 
              type="number" 
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
              min="0"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="IN">Masuk (Kiri)</option>
              <option value="OUT">Keluar (Kanan)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all shadow-md font-bold active:scale-95"
            >
              Simpan Manual
            </button>
          </div>
        </form>
      )}

      {/* AI Preview Mode UI */}
      {previewData && (
        <div className="mt-4 border-2 border-emerald-500 rounded-xl overflow-hidden bg-white shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="bg-emerald-500 text-white p-3 font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Preview Hasil Scan AI (Harap Verifikasi)
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
            {/* Left Column: Masuk */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b-2 border-emerald-200 pb-2">
                <h5 className="font-bold text-emerald-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Kolom Kiri (Pemasukan)
                </h5>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {previewData.filter(t => t.type === 'IN').length} Data
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {previewData.map((tr, idx) => tr.type === 'IN' && (
                  <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100 flex flex-col gap-2 relative group">
                    <button onClick={() => handleDeletePreviewItem(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm" title="Hapus baris ini">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <input type="date" value={tr.date} onChange={(e) => handleEditingPreview(idx, 'date', e.target.value)} className="w-full text-xs font-bold text-slate-500 bg-transparent border-b border-slate-100 focus:outline-none focus:border-emerald-400 py-1" />
                    <input type="text" value={tr.activity} onChange={(e) => handleEditingPreview(idx, 'activity', e.target.value)} className="w-full font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-slate-50 px-1 py-1 rounded" placeholder="Nama Kegiatan..." />
                    <div className="flex items-center gap-2 bg-emerald-50/50 p-1 rounded-lg border border-emerald-50/50">
                      <span className="font-bold text-emerald-600 text-sm ml-1">Rp</span>
                      <input type="number" value={tr.amount || ''} onChange={(e) => handleEditingPreview(idx, 'amount', e.target.value)} className="w-full font-bold text-emerald-700 bg-transparent focus:outline-none" placeholder="0" min="0" />
                    </div>
                  </div>
                ))}
                {previewData.filter(t => t.type === 'IN').length === 0 && (
                  <div className="text-center p-8 bg-white/50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">Tidak mendeteksi data pemasukan</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Keluar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b-2 border-red-200 pb-2">
                <h5 className="font-bold text-red-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Kolom Kanan (Pengeluaran)
                </h5>
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {previewData.filter(t => t.type === 'OUT').length} Data
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {previewData.map((tr, idx) => tr.type === 'OUT' && (
                  <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-red-100 flex flex-col gap-2 relative group">
                    <button onClick={() => handleDeletePreviewItem(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm" title="Hapus baris ini">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <input type="date" value={tr.date} onChange={(e) => handleEditingPreview(idx, 'date', e.target.value)} className="w-full text-xs font-bold text-slate-500 bg-transparent border-b border-slate-100 focus:outline-none focus:border-red-400 py-1" />
                    <input type="text" value={tr.activity} onChange={(e) => handleEditingPreview(idx, 'activity', e.target.value)} className="w-full font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-slate-50 px-1 py-1 rounded" placeholder="Nama Kegiatan..." />
                    <div className="flex items-center gap-2 bg-red-50/50 p-1 rounded-lg border border-red-50/50">
                      <span className="font-bold text-red-600 text-sm ml-1">Rp</span>
                      <input type="number" value={tr.amount || ''} onChange={(e) => handleEditingPreview(idx, 'amount', e.target.value)} className="w-full font-bold text-red-700 bg-transparent focus:outline-none" placeholder="0" min="0" />
                    </div>
                  </div>
                ))}
                {previewData.filter(t => t.type === 'OUT').length === 0 && (
                  <div className="text-center p-8 bg-white/50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">Tidak mendeteksi data pengeluaran</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 border-t flex justify-end gap-3 items-center">
             <span className="text-xs text-slate-500 mr-auto flex items-center gap-1">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Periksa kembali data sebelum menyimpan
             </span>
            <button 
              type="button" 
              onClick={() => setPreviewData(null)} 
              className="px-5 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button 
              type="button" 
              onClick={handleSavePreview} 
              className="px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
              disabled={previewData.length === 0}
            >
              <CheckCircle2 className="w-5 h-5" /> Simpan ke Tabel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TransactionForm;

