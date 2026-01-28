export type StrategyType = 'DAY_TRADE' | 'SWING' | 'OPTIONS';
export type ViewType = 'OVERVIEW' | StrategyType;
export type TransactionType = 'TRADE' | 'DEPOSIT' | 'WITHDRAWAL';

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  type: TransactionType;
  strategy: StrategyType;
  amount: number; // Absolute value stored, sign handling depends on type context
  note?: string;
}

export interface DayStats {
  date: string;
  pl: number; // Purely Trading P/L
  transactions: Transaction[];
  isProfit: boolean;
  isLoss: boolean;
  hasTrades: boolean;
}

export const VIEWS: { value: ViewType; label: string }[] = [
  { value: 'OVERVIEW', label: 'Overview' },
  { value: 'DAY_TRADE', label: 'Day Trade' },
  { value: 'SWING', label: 'Swing Trade' },
  { value: 'OPTIONS', label: 'Options' },
];

export const STRATEGIES: { value: StrategyType; label: string }[] = [
  { value: 'DAY_TRADE', label: 'Day Trade' },
  { value: 'SWING', label: 'Swing Trade' },
  { value: 'OPTIONS', label: 'Options' },
];