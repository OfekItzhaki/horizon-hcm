// Common Utility Types

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: any;
}

export interface APIError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
