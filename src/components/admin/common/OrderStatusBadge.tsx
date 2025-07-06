import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types/common';

const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

interface OrderStatusBadgeProps {
  status: OrderStatus | undefined | null;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  // Handle undefined or null status
  if (!status || !orderStatusColors[status]) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-gray-100 text-gray-800 ${className || ''}`}
      >
        Unknown
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${orderStatusColors[status]} ${className || ''}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </Badge>
  );
} 