
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, LogOut } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import LoginForm from './components/LoginForm';
import { Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_logged_in') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('masjid_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('masjid_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleLogin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'adminjmnh') {
      setIsLoggedIn(true);
      sessionStorage.setItem('is_admin_logged_in', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('is_admin_logged_in');
  };

  const handleAddTransaction = (newTr: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTr,
      id: `tr-${Date.now()}`
    };
    setTransactions(prev => [...prev, transaction]);
  };

  const handleBulkAdd = (newTransactions: Omit<Transaction, 'id'>[]) => {
    const timestamp = Date.now();
    const prepared = newTransactions.map((tr, index) => ({
      ...tr,
      id: `tr-bulk-${timestamp}-${index}`
    }));
    setTransactions(prev => [...prev, ...prepared]);
  };

  const handleUpdateTransaction = (updatedTr: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTr.id ? updatedTr : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== id));
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

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleLogout}
          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors border border-red-100 flex items-center gap-1.5 font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout Admin
        </button>
      </div>

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
          <TransactionForm onAdd={handleAddTransaction} onBulkAdd={handleBulkAdd} />
          <TransactionList 
            transactions={transactions} 
            onDelete={handleDeleteTransaction} 
            onUpdate={handleUpdateTransaction}
          />
        </div>
      )}
    </Layout>
  );
};

export default App;
