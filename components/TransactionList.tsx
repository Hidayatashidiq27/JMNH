
import React, { useState } from 'react';
import { Transaction } from '../types';
import { Inbox, Check, X, Pencil, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Transaction>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatIDR = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditValues(t);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (editingId && editValues.activity && editValues.date && editValues.amount !== undefined) {
      onUpdate(editValues as Transaction);
      setEditingId(null);
      setEditValues({});
    }
  };

  // Create a sorted copy
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-3 md:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h4 className="font-semibold text-slate-800 text-sm md:text-base">Riwayat Transaksi</h4>
        <div className="text-[10px] md:text-xs text-slate-400">Total {transactions.length} baris</div>
      </div>
      <div className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
              <th className="px-2 md:px-6 py-3 font-medium w-16 md:w-auto">Tanggal</th>
              <th className="px-2 md:px-6 py-3 font-medium">Kegiatan</th>
              <th className="px-2 md:px-6 py-3 font-medium hidden sm:table-cell">Kategori</th>
              <th className="px-2 md:px-6 py-3 font-medium text-right">Nominal</th>
              <th className="px-2 md:px-6 py-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex justify-center mb-2">
                    <Inbox className="w-10 h-10 text-slate-300" />
                  </div>
                  Belum ada data transaksi.
                </td>
              </tr>
            ) : (
              currentTransactions.map((t) => {
                const isEditing = editingId === t.id;

                return (
                  <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-2 md:px-6 py-3 whitespace-nowrap text-[10px] md:text-sm text-slate-600 font-medium align-top md:align-middle">
                      {isEditing ? (
                        <input 
                          type="date"
                          className="w-20 md:w-auto px-1 md:px-2 py-1 border border-slate-200 rounded text-[10px] md:text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={editValues.date}
                          onChange={(e) => setEditValues({...editValues, date: e.target.value})}
                        />
                      ) : (
                        new Date(t.date).toLocaleDateString('id-ID', { year: '2-digit', month: '2-digit', day: '2-digit' })
                      )}
                    </td>
                    <td className="px-2 md:px-6 py-3 text-[10px] md:text-sm text-slate-800 align-top md:align-middle">
                      <div className="flex items-start md:items-center gap-1 md:gap-2">
                        <span className={`w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-0 rounded-full flex-shrink-0 ${t.type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {isEditing ? (
                          <input 
                            type="text"
                            className="w-full min-w-[80px] px-1 md:px-2 py-1 border border-slate-200 rounded text-[10px] md:text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            value={editValues.activity}
                            onChange={(e) => setEditValues({...editValues, activity: e.target.value})}
                          />
                        ) : (
                          <span className="line-clamp-2 md:line-clamp-none">{t.activity}</span>
                        )}
                      </div>
                      {/* Show category on mobile inside the activity column */}
                      <div className="mt-1 sm:hidden ml-2.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] rounded uppercase font-bold">
                          {t.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 md:px-6 py-3 hidden sm:table-cell align-top md:align-middle">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-full uppercase font-bold whitespace-nowrap">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-2 md:px-6 py-3 text-[10px] md:text-sm font-bold text-right align-top md:align-middle ${t.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isEditing ? (
                        <input 
                          type="number"
                          className="w-16 md:w-24 px-1 md:px-2 py-1 border border-slate-200 rounded text-[10px] md:text-xs text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={editValues.amount}
                          onChange={(e) => setEditValues({...editValues, amount: parseFloat(e.target.value)})}
                        />
                      ) : (
                        <div className="whitespace-nowrap flex flex-col items-end">
                           <span className={`${t.type === 'IN' ? 'bg-emerald-50' : 'bg-red-50'} px-1 md:px-2 py-0.5 md:py-1 rounded`}>
                             {t.type === 'IN' ? '+' : '-'} {formatIDR(t.amount).replace('Rp', '').trim()}
                           </span>
                        </div>
                      )}
                    </td>
                    <td className="px-1 md:px-6 py-3 text-center align-top md:align-middle">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
                        {isEditing ? (
                          <>
                            <button 
                              type="button"
                              onClick={() => saveEdit()}
                              className="p-1 md:p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer text-xs md:text-base flex items-center justify-center"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => cancelEdit()}
                              className="p-1 md:p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-xs md:text-base flex items-center justify-center"
                              title="Batal"
                            >
                              <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              type="button"
                              onClick={() => startEdit(t)}
                              className="relative z-20 p-1 md:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center active:scale-90 text-xs md:text-base flex items-center justify-center"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            {confirmDeleteId === t.id ? (
                              <div className="flex flex-col gap-1 items-center bg-red-50 p-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => onDelete(t.id)}
                                  className="px-1 md:px-2 py-0.5 md:py-1 bg-red-500 text-white text-[8px] md:text-[10px] rounded hover:bg-red-600 font-bold whitespace-nowrap"
                                >
                                  Hapus?
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1 md:px-2 py-0.5 md:py-1 bg-slate-200 text-slate-700 text-[8px] md:text-[10px] rounded hover:bg-slate-300 font-bold whitespace-nowrap"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmDeleteId(t.id);
                                }}
                                className="relative z-20 p-1 md:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center active:scale-90 text-xs md:text-base flex items-center justify-center"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 p-3 md:p-4 gap-2">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="px-2 py-1 flex-1 sm:flex-none text-center text-xs md:text-sm bg-slate-100 text-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Sebelumnya
          </button>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium order-first w-full text-center sm:order-none sm:w-auto px-1">
            Halaman {currentPage} dari {totalPages}
          </span>
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
  );
};

export default TransactionList;

