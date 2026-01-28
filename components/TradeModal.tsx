import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, ArrowRightLeft, Briefcase } from 'lucide-react';
import { Transaction, TransactionType, StrategyType, STRATEGIES, ViewType } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  // onDelete prop removed in favor of global deleteTransaction
  existingTransactions: Transaction[];
  initialView: ViewType;
  initialMode?: 'TRADE' | 'TRANSFER'; 
}

export const TradeModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSave,
  existingTransactions,
  initialView,
  initialMode = 'TRADE'
}) => {
  // Form State
  const [type, setType] = useState<TransactionType>('TRADE');
  const [strategy, setStrategy] = useState<StrategyType>('DAY_TRADE');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'TRANSFER') {
        setType('DEPOSIT');
      } else {
        setType('TRADE');
      }

      if (initialView && initialView !== 'OVERVIEW') {
        setStrategy(initialView as StrategyType);
      } else {
        setStrategy('DAY_TRADE');
      }

      setAmount('');
      setNote('');
    }
  }, [isOpen, initialView, initialMode]);

  if (!isOpen || !selectedDate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onSave({
      date: selectedDate,
      type,
      strategy,
      amount: parseFloat(amount),
      note
    });
    setAmount('');
    setNote('');
  };

  const isTrade = type === 'TRADE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isTrade ? <Briefcase size={20} className="text-emerald-500"/> : <ArrowRightLeft size={20} className="text-blue-500"/>}
              {isTrade ? 'Record Trade' : 'Manage Capital'}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Date: <span className="text-zinc-200 font-medium">{selectedDate}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selector */}
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {initialMode === 'TRANSFER' ? (
                 <>
                  <button
                    type="button"
                    onClick={() => setType('DEPOSIT')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('WITHDRAWAL')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${type === 'WITHDRAWAL' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Withdraw
                  </button>
                 </>
              ) : (
                <button
                    type="button"
                    className="flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md bg-zinc-800 text-zinc-200 cursor-default"
                  >
                    Trading P/L Entry
                  </button>
              )}
            </div>

            {/* Strategy Select */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Allocated Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as StrategyType)}
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all appearance-none"
              >
                {STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                {isTrade ? 'Net Profit / Loss ($)' : 'Amount ($)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isTrade ? "e.g. 150 or -50" : "e.g. 1000"}
                  className={`w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 pl-8 outline-none transition-all focus:ring-2 ${
                    isTrade && parseFloat(amount) < 0 
                      ? 'focus:border-rose-500 focus:ring-rose-500/50' 
                      : 'focus:border-emerald-500 focus:ring-emerald-500/50'
                  }`}
                  autoFocus
                />
              </div>
              {isTrade && (
                <p className="text-xs text-zinc-500 mt-2">
                  Negative for losses (e.g. -50), Positive for wins.
                </p>
              )}
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. TSLA call, unexpected gap down"
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 outline-none transition-all focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              Save Transaction
            </button>
          </form>

          {/* History List */}
          {existingTransactions.length > 0 && (
            <div className="pt-6 border-t border-zinc-800 mt-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Activity for {selectedDate}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {existingTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-colors">
                    <div className="flex flex-col flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0
                          ${tx.type === 'TRADE' ? 'bg-zinc-800 text-zinc-400' : 
                            tx.type === 'DEPOSIT' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}
                        `}>
                          {tx.type}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium truncate">
                          {STRATEGIES.find(s => s.value === tx.strategy)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-medium ${
                          tx.type === 'WITHDRAWAL' || (tx.type === 'TRADE' && tx.amount < 0) ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {tx.type === 'WITHDRAWAL' ? '-' : (tx.amount >= 0 ? '+' : '')}{tx.amount.toFixed(2)}
                        </span>
                        {tx.note && <span className="text-xs text-zinc-600 truncate max-w-[150px]">— {tx.note}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.deleteTransaction(tx.id)}
                      className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                      title="Delete Transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};