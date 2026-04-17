export interface ApiResponse<T = any> {
  type: string;
  title: string;
  status: number;
  detail: string;
  meta?: Record<string, any>;
  data: T;
}
