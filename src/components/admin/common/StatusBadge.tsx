import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIGS, Status } from '@/types/common';

interface StatusBadgeProps {
  status: Status | undefined | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Handle undefined or null status
  if (!status || !STATUS_CONFIGS[status]) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-gray-100 text-gray-800 ${className || ''}`}
      >
        Unknown
      </Badge>
    );
  }

  const config = STATUS_CONFIGS[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className || ''}`}
    >
      {config.text}
    </Badge>
  );
} 