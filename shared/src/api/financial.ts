import { apiClient } from './client';
import type { Invoice, Payment, FinancialReport, DateRange, ReportType } from '../types';

export const invoicesApi = {
  getAll: (filters?: Record<string, any>) =>
    apiClient.get<Invoice[]>('/invoices', { params: filters }),

  getById: (id: string) => apiClient.get<Invoice>(`/invoices/${id}`),

  create: (data: Partial<Invoice>) => apiClient.post<Invoice>('/invoices', data),

  update: (id: string, data: Partial<Invoice>) => apiClient.patch<Invoice>(`/invoices/${id}`, data),

  cancel: (id: string, reason: string) => apiClient.post(`/invoices/${id}/cancel`, { reason }),

  bulkCreate: (data: {
    buildingId: string;
    apartmentIds: string[];
    amount: number;
    description: string;
    dueDate: Date;
  }) => apiClient.post<Invoice[]>('/invoices/bulk', data),
};

export const paymentsApi = {
  getAll: (filters?: Record<string, any>) =>
    apiClient.get<Payment[]>('/payments', { params: filters }),

  getById: (id: string) => apiClient.get<Payment>(`/payments/${id}`),

  create: (data: Partial<Payment>) => apiClient.post<Payment>('/payments', data),

  downloadReceipt: (id: string) =>
    apiClient.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
};

export const reportsApi = {
  getBalance: (buildingId: string, dateRange?: DateRange) =>
    apiClient.get<FinancialReport>(`/buildings/${buildingId}/reports/balance`, {
      params: dateRange,
    }),

  getIncomeExpense: (buildingId: string, dateRange?: DateRange) =>
    apiClient.get<FinancialReport>(`/buildings/${buildingId}/reports/income`, {
      params: dateRange,
    }),

  getBudgetComparison: (buildingId: string, dateRange?: DateRange) =>
    apiClient.get<FinancialReport>(`/buildings/${buildingId}/reports/budget-comparison`, {
      params: dateRange,
    }),

  getYearOverYear: (buildingId: string, years?: number[]) =>
    apiClient.get<FinancialReport>(`/buildings/${buildingId}/reports/year-over-year`, {
      params: years ? { year: years[1] } : undefined,
    }),

  exportToPDF: (reportType: ReportType, params: any) =>
    apiClient.get(`/buildings/${params.buildingId}/reports/export`, {
      params: { ...params, reportType, format: 'pdf' },
      responseType: 'blob',
    }),

  exportToExcel: (reportType: ReportType, params: any) =>
    apiClient.get(`/buildings/${params.buildingId}/reports/export`, {
      params: { ...params, reportType, format: 'csv' },
      responseType: 'blob',
    }),
};
