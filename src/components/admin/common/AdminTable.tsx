import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { FilterParams, Status } from '@/types/common';

// Table column interface to support both old and new formats
export interface TableColumn<T> {
  key?: keyof T | 'actions';
  id?: string;
  label?: string;
  header?: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  cell?: (item: T) => React.ReactNode;
}

// Support both old and new column formats (for backward compatibility)
interface Column<T> {
  key?: keyof T | 'actions';
  id?: string;
  label?: string;
  header?: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  cell?: (item: T) => React.ReactNode;
}

// Status option type to support both string and object format
interface StatusOption {
  value: string;
  label: string;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading: boolean;
  error: string | null;
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  statusOptions?: (Status | StatusOption)[];
}

export function AdminTable<T>({
  data,
  columns,
  loading,
  error,
  filters,
  onFilterChange,
  onSort,
  statusOptions
}: AdminTableProps<T>) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (value: string) => {
    setSearch(value);
    onFilterChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value as Status });
  };

  const handleSort = (field: string) => {
    const direction = filters.sortField === field && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, direction);
  };

  // Helper function to get column identifier (id or key)
  const getColumnId = (column: Column<T>): string => {
    return (column.id || column.key) as string;
  };

  // Helper function to get column header text (header or label)
  const getColumnHeader = (column: Column<T>): string => {
    return (column.header || column.label) as string;
  };

  // Helper function to normalize status options
  const normalizeStatusOptions = (options?: (Status | StatusOption)[]): StatusOption[] => {
    if (!options) return [];
    
    return options.map(option => {
      if (typeof option === 'string') {
        // Convert string to object format with capitalized label
        return {
          value: option,
          label: option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')
        };
      }
      return option as StatusOption;
    });
  };

  const normalizedStatusOptions = normalizeStatusOptions(statusOptions);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load data</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        {normalizedStatusOptions.length > 0 && (
          <Select 
            value={filters.status} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {normalizedStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={getColumnId(column)}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(getColumnId(column))}
                      className="flex items-center gap-1"
                    >
                      {getColumnHeader(column)}
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  ) : (
                    getColumnHeader(column)
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6 text-gray-500">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={getColumnId(column)}>
                      {column.cell ? (
                        column.cell(item)
                      ) : column.render ? (
                        column.render(column.key ? item[column.key] : null, item)
                      ) : column.key ? (
                        String(item[column.key] || '-')
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 