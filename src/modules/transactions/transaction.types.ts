export interface CreateTransactionDTO {
  userId: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  categoryName?: string;
  paymentMethod?: string;
  date?: Date;
  source?: string;
}

export interface BalanceResult {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  name: string;
  icon: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyCategorySummary {
  totalExpenses: number;
  breakdown: CategoryBreakdown[];
}
