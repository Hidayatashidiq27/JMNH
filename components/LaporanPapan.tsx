
import React from 'react';
import { Transaction } from '../types';
import { MoonStar } from 'lucide-react';

interface LaporanPapanProps {
  transactions: Transaction[];
  periodLabel?: string;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatTanggal = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

const LaporanPapan: React.FC<LaporanPapanProps> = ({ transactions, periodLabel }) => {
  const masuk = transactions
    .filter((t) => t.type === 'IN')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const keluar = transactions
    .filter((t) => t.type === 'OUT')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalMasuk = masuk.reduce((s, t) => s + t.amount, 0);
  const totalKeluar = keluar.reduce((s, t) => s + t.amount, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  const Baris: React.FC<{ t: Transaction }> = ({ t }) => (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-dotted border-white/25">
      <div className="min-w-0">
        <p className="text-sm md:text-base leading-tight break-words">{t.activity}</p>
        <p className="text-[10px] md:text-xs text-white/60">{formatTanggal(t.date)}</p>
      </div>
      <p className="text-sm md:text-base font-semibold whitespace-nowrap">{formatIDR(t.amount)}</p>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="text-center px-4 py-5 border-b border-white/20">
        <div className="flex items-center justify-center gap-2 text-emerald-200">
          <MoonStar className="w-5 h-5" />
          <span className="text-xs md:text-sm font-medium">Masjid Nurul Huda</span>
        </div>
        <h3 className="text-lg md:text-2xl font-bold tracking-wide mt-1">LAPORAN KEUANGAN</h3>
        {periodLabel && <p className="text-emerald-200 text-xs md:text-sm mt-0.5">Periode: {periodLabel}</p>}
      </div>

      {/* Dua kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* PEMASUKAN */}
        <div className="p-4 md:p-6 md:border-r border-white/20">
          <h4 className="text-center font-bold text-base md:text-lg tracking-wide mb-3 text-emerald-100">PEMASUKAN</h4>
          {masuk.length === 0 ? (
            <p className="text-center text-white/50 text-sm py-4">Tidak ada pemasukan pada periode ini.</p>
          ) : (
            masuk.map((t) => <Baris key={t.id} t={t} />)
          )}
          <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-white/40">
            <span className="font-bold text-sm md:text-base">Total Pemasukan</span>
            <span className="font-bold text-sm md:text-base text-emerald-200">{formatIDR(totalMasuk)}</span>
          </div>
        </div>

        {/* PENGELUARAN */}
        <div className="p-4 md:p-6 border-t md:border-t-0 border-white/20">
          <h4 className="text-center font-bold text-base md:text-lg tracking-wide mb-3 text-emerald-100">PENGELUARAN</h4>
          {keluar.length === 0 ? (
            <p className="text-center text-white/50 text-sm py-4">Tidak ada pengeluaran pada periode ini.</p>
          ) : (
            keluar.map((t) => <Baris key={t.id} t={t} />)
          )}
          <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-white/40">
            <span className="font-bold text-sm md:text-base">Total Pengeluaran</span>
            <span className="font-bold text-sm md:text-base text-red-200">{formatIDR(totalKeluar)}</span>
          </div>
        </div>
      </div>

      {/* Saldo Akhir */}
      <div className="bg-black/20 px-4 md:px-6 py-4 flex items-center justify-between">
        <span className="text-base md:text-xl font-bold tracking-wide">SALDO AKHIR</span>
        <span className="text-xl md:text-3xl font-extrabold">{formatIDR(saldoAkhir)}</span>
      </div>
    </div>
  );
};

export default LaporanPapan;
