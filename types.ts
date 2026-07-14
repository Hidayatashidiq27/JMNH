
export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  date: string;
  activity: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export interface DashboardStats {
  totalIn: number;
  totalOut: number;
  balance: number;
}
