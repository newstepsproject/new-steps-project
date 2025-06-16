import { Badge } from '@/components/ui/badge';
import { RequestStatus } from '@/types/common';

const requestStatusColors: Record<RequestStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  rejected: 'bg-red-100 text-red-800',
};

interface RequestStatusBadgeProps {
  status: RequestStatus | string | undefined | null;
  className?: string;
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  // Handle undefined or null status
  if (!status) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-gray-100 text-gray-800 ${className || ''}`}
      >
        Unknown
      </Badge>
    );
  }

  // Get color for the status, default to gray if not found
  const statusKey = status as RequestStatus;
  const colorClass = requestStatusColors[statusKey] || 'bg-gray-100 text-gray-800';

  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} ${className || ''}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
} 