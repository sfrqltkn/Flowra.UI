export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId?: string;
  // Validation, BusinessRule veya Conflict hataları bu dictionary içine düşer
  errors?: Record<string, string[]>;
}
