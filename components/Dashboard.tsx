
import React, { useState } from 'react';
import { Transaction } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, DownloadCloud, UploadCloud, Wallet, Sparkles, Bell, FileText, QrCode, ScrollText } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  openingBalance?: number;
  periodLabel?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, openingBalance, periodLabel }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const isPeriod = openingBalance !== undefined;

  const totalIn = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIn - totalOut;
  const closingBalance = (openingBalance || 0) + totalIn - totalOut;

  // Chart data: Group by date
  const chartData = transactions.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.date === t.date);
    if (existing) {
      if (t.type === 'IN') existing.masuk += t.amount;
      else existing.keluar += t.amount;
    } else {
      acc.push({ 
        date: t.date, 
        masuk: t.type === 'IN' ? t.amount : 0, 
        keluar: t.type === 'OUT' ? t.amount : 0 
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pieData = [
    { name: 'Pemasukan', value: totalIn, color: '#10b981' },
    { name: 'Pengeluaran', value: totalOut, color: '#ef4444' }
  ];

  const formatIDR = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Filter and Sort Transactions
  const filteredAndSortedTransactions = transactions
    .filter(t => (searchTerm ? t.activity.toLowerCase().includes(searchTerm.toLowerCase()) : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Kas Keuangan Masjid Nurul Huda', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tercetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 28, { align: 'center' });

    let y = 40;
    doc.setFontSize(11);
    if (isPeriod) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Periode: ${periodLabel || ''}`, 14, y); y += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`Saldo Awal: ${formatIDR(openingBalance || 0)}`, 14, y); y += 6;
      doc.text(`Pemasukan: ${formatIDR(totalIn)}`, 14, y); y += 6;
      doc.text(`Pengeluaran: ${formatIDR(totalOut)}`, 14, y); y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text(`Saldo Akhir: ${formatIDR(closingBalance)}`, 14, y); y += 8;
    } else {
      doc.text(`Total Pemasukan: ${formatIDR(totalIn)}`, 14, y); y += 6;
      doc.text(`Total Pengeluaran: ${formatIDR(totalOut)}`, 14, y); y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text(`Saldo Akhir: ${formatIDR(balance)}`, 14, y); y += 8;
    }

    // Table
    const tableColumn = ["No", "Tanggal", "Keterangan", "Masuk (Rp)", "Keluar (Rp)"];
    
    // Only export filtered list if user applied filters, otherwise export all
    const tableRows = filteredAndSortedTransactions.map((t, index) => [
      index + 1,
      new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
      t.activity,
      t.type === 'IN' ? formatIDR(t.amount).replace('Rp', '').trim() : '-',
      t.type === 'OUT' ? formatIDR(t.amount).replace('Rp', '').trim() : '-'
    ]);

    const filteredTotalIn = filteredAndSortedTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const filteredTotalOut = filteredAndSortedTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);

    tableRows.push([
      '', '', 'TOTAL FILTER',
      formatIDR(filteredTotalIn).replace('Rp', '').trim(), 
      formatIDR(filteredTotalOut).replace('Rp', '').trim()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Signatures
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mengetahui,', 40, finalY + 20, { align: 'center' });
    doc.text('Ketua Takmir Masjid Nurul Huda', 40, finalY + 25, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Wisnu Satriyoko', 40, finalY + 45, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.text('Dibuat oleh,', 170, finalY + 20, { align: 'center' });
    doc.text('Sekretaris', 170, finalY + 25, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Hidayat Ashidiq', 170, finalY + 45, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.save(`Laporan_Kas_Nurul_Huda_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {isPeriod ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-xs md:text-sm font-medium">Saldo Awal</p>
            <h3 className="text-lg md:text-2xl font-bold text-slate-700 mt-2">{formatIDR(openingBalance || 0)}</h3>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-emerald-100">
            <p className="text-slate-500 text-xs md:text-sm font-medium">Pemasukan</p>
            <h3 className="text-lg md:text-2xl font-bold text-emerald-600 mt-2">{formatIDR(totalIn)}</h3>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-red-100">
            <p className="text-slate-500 text-xs md:text-sm font-medium">Pengeluaran</p>
            <h3 className="text-lg md:text-2xl font-bold text-red-600 mt-2">{formatIDR(totalOut)}</h3>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-4 md:p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Wallet className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <p className="text-emerald-100 text-xs md:text-sm font-medium">Saldo Akhir</p>
            <h3 className="text-lg md:text-2xl font-bold mt-2">{formatIDR(closingBalance)}</h3>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
              <DownloadCloud className="w-16 h-16" strokeWidth={1} />
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Pemasukan</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-2">{formatIDR(totalIn)}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600">
              <UploadCloud className="w-16 h-16" strokeWidth={1} />
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Pengeluaran</p>
            <h3 className="text-2xl font-bold text-red-600 mt-2">{formatIDR(totalOut)}</h3>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Wallet className="w-16 h-16" strokeWidth={1.5} />
            </div>
            <p className="text-emerald-100 text-sm font-medium">Saldo Kas Saat Ini</p>
            <h3 className="text-3xl font-bold mt-2">{formatIDR(balance)}</h3>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Flow Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-800 font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Aliran Kas (Time Series)
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => formatIDR(val)}
                />
                <Area type="monotone" dataKey="masuk" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="keluar" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratio Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h4 className="text-slate-800 font-semibold mb-6 self-start flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Komposisi Kas
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => formatIDR(val)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 max-w-xs">
              Rasio efisiensi penggunaan dana masjid Nurul Huda berdasarkan perbandingan pemasukan dan pengeluaran.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h4 className="text-slate-800 font-semibold flex items-center gap-2 text-sm md:text-base">
              <ScrollText className="w-5 h-5 text-slate-500" />
              Riwayat Transaksi
            </h4>
            <button 
              onClick={handleExportPDF}
              className="text-[10px] sm:text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all border border-red-200 font-bold flex items-center gap-2 w-fit"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download Laporan (PDF)
            </button>
          </div>
          
          {/* Pencarian */}
          <div className="w-full md:w-auto text-sm">
             <input
               type="text"
               placeholder="Cari keterangan..."
               value={searchTerm}
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               className="w-full md:w-64 border border-slate-200 rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[10px] sm:text-sm"
             />
          </div>
        </div>
        
        <div className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 uppercase text-[10px] md:text-xs tracking-wider">
                <th className="pb-3 font-semibold w-20 md:w-28">Tanggal</th>
                <th className="pb-3 font-semibold">Keterangan</th>
                <th className="pb-3 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 text-slate-600 font-medium text-[10px] md:text-sm whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('id-ID', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="py-3 text-slate-800 font-bold text-[10px] md:text-sm pr-2 leading-tight">
                    <div className="line-clamp-2 md:truncate md:max-w-[200px]" title={t.activity}>
                      {t.activity}
                    </div>
                  </td>
                  <td className="py-3 text-right text-[10px] md:text-sm whitespace-nowrap">
                    {t.type === 'IN' ? (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 md:px-2 py-1 rounded-lg">
                        + {formatIDR(t.amount)}
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold bg-red-50 px-1.5 md:px-2 py-1 rounded-lg">
                        - {formatIDR(t.amount)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[10px] md:text-sm text-slate-400">
                    Tidak ada transaksi yang sesuai
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-2">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
              className="px-2 py-1 flex-1 sm:flex-none text-center text-xs md:text-sm bg-slate-100 text-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              Sebelumnya
            </button>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium order-first w-full text-center sm:order-none sm:w-auto px-1">Halaman {currentPage} dari {totalPages}</span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
              className="px-2 py-1 flex-1 sm:flex-none text-center text-xs md:text-sm bg-emerald-100 text-emerald-700 rounded-lg disabled:opacity-50 hover:bg-emerald-200 transition-colors whitespace-nowrap"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* Recommended Features Card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
        <h4 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" /> Rekomendasi Fitur Mendatang
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 hover:scale-105 transition-transform cursor-pointer">
            <Bell className="w-5 h-5 mb-2 text-blue-500" />
            <h5 className="font-semibold text-emerald-900 text-sm">Notifikasi Pengingat Bayar</h5>
            <p className="text-xs text-emerald-700 mt-1">Ingatkan admin untuk tagihan rutin (Listrik, Air, Kebersihan) via WhatsApp.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 hover:scale-105 transition-transform cursor-pointer">
            <FileText className="w-5 h-5 mb-2 text-red-500" />
            <h5 className="font-semibold text-emerald-900 text-sm">Export Laporan PDF/Excel</h5>
            <p className="text-xs text-emerald-700 mt-1">Cetak laporan bulanan otomatis untuk ditempel di papan pengumuman masjid.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 hover:scale-105 transition-transform cursor-pointer">
            <QrCode className="w-5 h-5 mb-2 text-indigo-500" />
            <h5 className="font-semibold text-emerald-900 text-sm">Integrasi QRIS Masjid</h5>
            <p className="text-xs text-emerald-700 mt-1">Input otomatis data infaq digital yang masuk melalui QRIS masjid ke sistem ini.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
