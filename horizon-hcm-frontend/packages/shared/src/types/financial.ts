// Financial Types

import type { DateRange } from './common';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type ReportType = 'balance' | 'income_expense' | 'budget_comparison' | 'year_over_year';

export interface Invoice {
  id: string;
  buildingId: string;
  apartmentId: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: Date;
  status: InvoiceStatus;
  attachments: Document[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  paymentId?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  paidBy: string;
  paidAt: Date;
  receiptUrl: string;
}

export interface FinancialReport {
  type: ReportType;
  buildingId: string;
  dateRange: DateRange;
  data: ReportData;
  generatedAt: Date;
}

export interface ReportData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categories: CategoryData[];
  trend: TrendData[];
  comparison?: ComparisonData;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
}

export interface TrendData {
  date: Date;
  income: number;
  expense: number;
  balance: number;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface Document {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  versions: DocumentVersion[];
  uploadedBy: string;
  uploadedAt: Date;
  restrictedTo?: string[];
}

export interface DocumentVersion {
  version: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}
