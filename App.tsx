
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, LogOut, LogIn, Loader2, AlertCircle } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import ReceiptGallery from './components/ReceiptGallery';
import LoginForm from './components/LoginForm';
import { Transaction } from './types';
import * as dataService from './services/dataService';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('is_admin') === 'true');
  const [showLogin, setShowLogin] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getTransactions();
      setTransactions(data);
      setLoadError(null);
    } catch (err) {
      console.error('Gagal memuat data:', err);
      setLoadError('Gagal memuat data dari server. Pastikan Supabase sudah dikonfigurasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = async (_user: string, pass: string) => {
    const ok = await dataService.login(pass);
    if (ok) {
      sessionStorage.setItem('is_admin', 'true');
      sessionStorage.setItem('admin_pass', pass);
      setIsAdmin(true);
      setShowLogin(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('is_admin');
    sessionStorage.removeItem('admin_pass');
    setIsAdmin(false);
    setActiveTab('dashboard');
  };

  const handleAddTransaction = async (newTr: Omit<Transaction, 'id'>) => {
    const created = await dataService.addTransaction(newTr);
    setTransactions(prev => [...prev, created]);
  };

  const handleBulkAdd = async (newTransactions: Omit<Transaction, 'id'>[]) => {
    const created = await dataService.addTransactions(newTransactions);
    setTransactions(prev => [...prev, ...created]);
  };

  const handleUpdateTransaction = async (updatedTr: Transaction) => {
    const saved = await dataService.updateTransaction(updatedTr);
    setTransactions(prev => prev.map(t => (t.id === saved.id ? saved : t)));
  };

  const handleDeleteTransaction = async (id: string) => {
    await dataService.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Kegiatan', 'Tipe', 'Nominal', 'Kategori'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.activity.replace(/,/g, ''),
      t.type,
      t.amount,
      t.category
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_kas_nurul_huda_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    // Summary
    const totalIn = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIn - totalOut;

    const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    doc.setFontSize(11);
    doc.text(`Total Pemasukan: ${formatIDR(totalIn)}`, 14, 40);
    doc.text(`Total Pengeluaran: ${formatIDR(totalOut)}`, 14, 46);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Akhir: ${formatIDR(balance)}`, 14, 52);

    // Table
    const tableColumn = ["No", "Tanggal", "Keterangan", "Masuk (Rp)", "Keluar (Rp)"];

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const tableRows = sortedTransactions.map((t, index) => [
      index + 1,
      new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
      t.activity,
      t.type === 'IN' ? formatIDR(t.amount).replace('Rp', '').trim() : '-',
      t.type === 'OUT' ? formatIDR(t.amount).replace('Rp', '').trim() : '-'
    ]);

    tableRows.push([
      '', '', 'TOTAL KESELURUHAN',
      formatIDR(totalIn).replace('Rp', '').trim(),
      formatIDR(totalOut).replace('Rp', '').trim()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
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

  // Layar login admin (hanya tampil saat tombol Login ditekan).
  if (showLogin && !isAdmin) {
    return <LoginForm onLogin={handleLogin} onCancel={() => setShowLogin(false)} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin}>
      <div className="flex justify-end mb-4">
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors border border-red-100 flex items-center gap-1.5 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout Admin
          </button>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100 flex items-center gap-1.5 font-medium"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login Admin
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Memuat data...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-slate-600 max-w-md">{loadError}</p>
          <button
            onClick={loadData}
            className="mt-4 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard transactions={transactions} />
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleExportPDF}
                  className="text-[10px] md:text-xs bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition-all border border-red-200 font-bold flex items-center gap-1.5 md:gap-2"
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  className="text-[10px] md:text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200 font-bold flex items-center gap-1.5 md:gap-2"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Download CSV
                </button>
              </div>
              {isAdmin && (
                <TransactionForm onAdd={handleAddTransaction} onBulkAdd={handleBulkAdd} />
              )}
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                onUpdate={handleUpdateTransaction}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {activeTab === 'receipts' && isAdmin && (
            <ReceiptGallery />
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
