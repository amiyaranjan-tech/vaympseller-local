// Matches utils/ApiResponse.js on the backend exactly.
export interface ApiEnvelope<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta: unknown;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}
