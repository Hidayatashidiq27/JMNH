
import React from 'react';
import { LayoutDashboard, Wallet, MoonStar, Image as ImageIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin = false }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" /> },
    { id: 'transactions', label: 'Kas & Transaksi', icon: <Wallet className="w-5 h-5 md:w-6 md:h-6" /> },
    ...(isAdmin
      ? [{ id: 'receipts', label: 'Bukti Foto', icon: <ImageIcon className="w-5 h-5 md:w-6 md:h-6" /> }]
      : []),
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-emerald-800 text-white px-4 py-3 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MoonStar className="w-5 h-5 text-emerald-300" />
          Nurul Huda
        </h1>
        <div className="flex items-center gap-2 text-xs text-emerald-200">
           <span className={`w-2 h-2 rounded-full animate-pulse ${isAdmin ? 'bg-emerald-400' : 'bg-amber-300'}`}></span>
           {isAdmin ? 'Admin' : 'Publik'}
        </div>
      </div>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <aside className="fixed bottom-0 left-0 w-full md:relative md:w-64 bg-white md:bg-emerald-800 border-t md:border-none border-slate-200 text-slate-500 md:text-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-xl md:sticky md:top-0 md:h-screen z-50 flex md:flex-col pb-safe">
        
        {/* Desktop Logo Area */}
        <div className="hidden md:block p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MoonStar className="w-6 h-6 text-emerald-300" />
            Nurul Huda Digital
          </h1>
          <p className="text-emerald-200 text-xs mt-1">Sistem Manajemen Masjid</p>
        </div>
        
        <nav className="flex-1 flex md:block px-2 py-2 md:px-4 md:py-4 gap-1 md:space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 py-2 md:px-4 md:py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'text-emerald-600 md:bg-white md:text-emerald-800 font-semibold md:shadow-lg' 
                  : 'text-slate-400 hover:text-emerald-600 md:text-emerald-100 md:hover:bg-emerald-700'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'scale-110 mb-0.5 md:mb-0 md:scale-100' : ''} transition-transform`}>{tab.icon}</div>
              <span className="text-[10px] md:text-base whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Desktop Footer */}
        <div className="hidden md:block p-4 border-t border-emerald-700 text-center mt-auto">
          <p className="text-[10px] text-emerald-300">© 2024 Masjid Nurul Huda</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:overflow-y-auto mb-[70px] md:mb-0">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span className={`w-2 h-2 rounded-full animate-pulse ${isAdmin ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
             {isAdmin ? 'Mode Admin' : 'Tampilan Publik'}
          </div>
        </header>

        {/* Mobile Current Tab Indicator */}
        <div className="md:hidden bg-white px-4 py-3 border-b border-slate-200 sticky top-[52px] z-40 flex justify-between items-center shadow-sm">
           <h2 className="text-sm font-semibold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
