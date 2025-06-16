export interface TableColumn<T> {
  key: keyof T | 'actions';
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FilterParams {
  search?: string;
  status?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export type Status = string; 