import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, Wallet, PieChart, PlusCircle, ArrowDownUp, Crosshair, BarChart3, Trash2, History, ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react';
import { Transaction, ViewType, DayStats, STRATEGIES } from './types';
import { 
  getMonthName, 
  formatCurrency, 
  generateCalendarDays, 
  formatDateISO,
  formatPercentage
} from './utils/dateHelpers';
import { StrategySelector } from './components/StrategySelector';
import { TradeModal } from './components/TradeModal';

// Extend Window interface for the global delete function
declare global {
  interface Window {
    deleteTransaction: (id: string) => void;
  }
}

// Robust ID generator fallback
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

function App() {
  // --- Global State ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('pro-trade-data');
      let parsed = saved ? JSON.parse(saved) : [];
      
      // Migration: Ensure every transaction has a unique ID
      if (Array.isArray(parsed)) {
        parsed = parsed.map((t: any) => ({
          ...t,
          id: t.id ? String(t.id) : generateId() // Ensure ID is string
        }));
      } else {
        parsed = [];
      }
      return parsed;
    } catch (e) {
      console.error("Failed to load transactions", e);
      return [];
    }
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('OVERVIEW');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'TRADE' | 'TRANSFER'>('TRADE');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('pro-trade-data', JSON.stringify(transactions));
  }, [transactions]);

  // --- GLOBAL DELETE FUNCTION (The "Nuclear" Option) ---
  useEffect(() => {
    // We define this on window to ensure it is accessible globally and robust against closure staleness
    window.deleteTransaction = (id: string) => {
      const safeId = String(id);
      console.log("Global delete initiated for ID:", safeId);
      
      // REMOVED window.confirm due to sandbox restrictions
      // Immediate deletion:
      setTransactions(prev => {
        const newData = prev.filter(t => String(t.id) !== safeId);
        console.log(`Deleted ${safeId}. Remaining: ${newData.length}`);
        // Force immediate storage update for safety
        localStorage.setItem('pro-trade-data', JSON.stringify(newData));
        return newData;
      });
    };

    // Cleanup not strictly necessary for global on window in top-level app, but good practice
    return () => {
      // @ts-ignore
      delete window.deleteTransaction;
    };
  }, []); // Run once on mount to attach handler

  // --- Core Logic & Math ---

  // 1. Filter Transactions based on View
  const filteredTransactions = useMemo(() => {
    let txs = transactions;
    if (currentView !== 'OVERVIEW') {
      txs = transactions.filter(t => t.strategy === currentView);
    }
    // Create copy before sort to avoid mutation
    return [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentView]);

  // 2. Dashboard Metrics
  const stats = useMemo(() => {
    let investedCapital = 0;
    let netProfit = 0;
    let tradeCount = 0;
    
    let grossProfit = 0;
    let grossLoss = 0;
    let winCount = 0;
    let lossCount = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'DEPOSIT') investedCapital += t.amount;
      if (t.type === 'WITHDRAWAL') investedCapital -= t.amount;
      if (t.type === 'TRADE') {
        netProfit += t.amount;
        tradeCount++;
        
        if (t.amount > 0) {
          grossProfit += t.amount;
          winCount++;
        } else if (t.amount < 0) {
          grossLoss += Math.abs(t.amount);
          lossCount++;
        }
      }
    });

    const portfolioValue = investedCapital + netProfit;
    const roi = investedCapital !== 0 ? (netProfit / investedCapital) * 100 : 0;
    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
    
    const avgWin = winCount > 0 ? grossProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    return { 
      investedCapital, 
      netProfit, 
      portfolioValue, 
      roi, 
      winRate, 
      tradeCount,
      avgWin,
      avgLoss,
      profitFactor
    };
  }, [filteredTransactions]);

  // 3. Calendar Data
  const calendarDays = useMemo(() => generateCalendarDays(currentDate), [currentDate]);
  
  const getDayStats = (dateStr: string): DayStats => {
    const dayTx = filteredTransactions.filter(t => t.date === dateStr);
    const pl = dayTx
      .filter(t => t.type === 'TRADE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      date: dateStr,
      pl,
      transactions: dayTx,
      isProfit: pl > 0,
      isLoss: pl < 0,
      hasTrades: dayTx.some(t => t.type === 'TRADE')
    };
  };

  // --- Handlers ---
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const openModal = (dateStr: string, mode: 'TRADE' | 'TRANSFER') => {
    setSelectedDateStr(dateStr);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleDayClick = (dateStr: string) => {
    openModal(dateStr, 'TRADE');
  };

  const handleGlobalAction = (mode: 'TRADE' | 'TRANSFER') => {
    const today = formatDateISO(new Date());
    openModal(today, mode);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...txData, id: generateId() };
    setTransactions(prev => [...prev, newTx]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Top Navigation Bar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <TrendingUp className="text-emerald-500" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ProTrade</h1>
              <p className="text-xs text-zinc-500 font-medium">Portfolio Tracker</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto overflow-x-auto">
            <StrategySelector currentView={currentView} onChange={setCurrentView} />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        
        {/* Dashboard Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Row 1 */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Portfolio Value</p>
            <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">{formatCurrency(stats.portfolioValue)}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Invested Capital</p>
            <p className="text-2xl font-bold text-zinc-200 tracking-tight truncate">{formatCurrency(stats.investedCapital)}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Net Profit</p>
            <p className={`text-2xl font-bold tracking-tight truncate ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">ROI</p>
            <p className={`text-2xl font-bold tracking-tight ${stats.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.roi >= 0 ? '+' : ''}{formatPercentage(stats.roi)}
            </p>
          </div>

           <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Crosshair size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Win Rate</p>
            <p className={`text-2xl font-bold tracking-tight ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {formatPercentage(stats.winRate)}
            </p>
          </div>

          {/* Row 2 */}
           <div className="col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-4 opacity-10"><History size={80} /></div>
            <div className="relative z-10">
              <p className="text-sm text-zinc-500 font-medium mb-1">Total Trades Completed</p>
              <p className="text-4xl font-bold text-white tracking-tight">{stats.tradeCount}</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowUpRight size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Avg. Win</p>
            <p className="text-xl font-bold text-emerald-400 tracking-tight">+{formatCurrency(stats.avgWin)}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowDownLeft size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Avg. Loss</p>
            <p className="text-xl font-bold text-rose-400 tracking-tight">-{formatCurrency(stats.avgLoss)}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Scale size={64} /></div>
            <p className="text-sm text-zinc-500 font-medium mb-1">Profit Factor</p>
            <p className={`text-xl font-bold tracking-tight ${stats.profitFactor >= 1.5 ? 'text-emerald-400' : stats.profitFactor >= 1 ? 'text-yellow-400' : 'text-rose-400'}`}>
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </p>
          </div>
        </section>

        {/* Global Action Buttons */}
        <section className="flex items-center gap-3">
          <button 
            onClick={() => handleGlobalAction('TRADE')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
          >
            <PlusCircle size={20} />
            Add Trade
          </button>
          <button 
            onClick={() => handleGlobalAction('TRANSFER')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 border border-zinc-700"
          >
            <ArrowDownUp size={20} />
            Deposit / Withdraw
          </button>
        </section>

        {/* Calendar Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="text-zinc-500" size={20}/>
              Performance Calendar
            </h2>
            <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
              <span className="text-sm font-semibold w-32 text-center select-none">{getMonthName(currentDate)} {currentDate.getFullYear()}</span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.day || !cell.dateStr) return <div key={`empty-${idx}`} className="aspect-square" />;
              const dayStats = getDayStats(cell.dateStr);
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => handleDayClick(cell.dateStr!)}
                  className={`
                    group relative aspect-square rounded-xl border p-1 sm:p-2 flex flex-col justify-between transition-all duration-200 outline-none
                    ${dayStats.hasTrades 
                      ? dayStats.isProfit 
                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' 
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'}
                  `}
                >
                  <span className={`text-xs font-semibold ${dayStats.hasTrades ? 'text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{cell.day}</span>
                  {dayStats.hasTrades && (
                    <div className="flex flex-col items-end w-full">
                      <span className={`text-[10px] sm:text-xs font-bold font-mono ${dayStats.isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {dayStats.pl >= 0 ? '+' : ''}{Math.abs(dayStats.pl).toLocaleString('en-US', { notation: "compact", maximumFractionDigits: 1 })}
                      </span>
                    </div>
                  )}
                  {!dayStats.hasTrades && dayStats.transactions.length > 0 && (
                    <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Transactions Table */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-500 font-medium border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Strategy</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No transactions found for this view.</td>
                  </tr>
                ) : (
                  filteredTransactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-zinc-300 font-medium whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide
                          ${tx.type === 'TRADE' ? 'bg-zinc-800 text-zinc-300' : 
                            tx.type === 'DEPOSIT' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}
                        `}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{STRATEGIES.find(s => s.value === tx.strategy)?.label}</td>
                      <td className={`px-6 py-4 font-mono font-bold ${
                        tx.type === 'WITHDRAWAL' || (tx.type === 'TRADE' && tx.amount < 0) ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {tx.type === 'WITHDRAWAL' ? '-' : (tx.amount >= 0 ? '+' : '')}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 truncate max-w-[200px]" title={tx.note}>{tx.note || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          type="button"
                          onClick={() => window.deleteTransaction(tx.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length > 0 && (
             <div className="p-4 bg-zinc-950/30 border-t border-zinc-800 text-center">
                <span className="text-xs text-zinc-500 italic">Showing latest 5 records only</span>
             </div>
          )}
        </section>

      </main>

      <TradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDateStr}
        onSave={handleSaveTransaction}
        // onDelete prop removed - using global handler in Modal
        existingTransactions={selectedDateStr ? transactions.filter(t => t.date === selectedDateStr) : []}
        initialView={currentView}
        initialMode={modalMode}
      />
    </div>
  );
}

export default App;