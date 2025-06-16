import { Badge } from '@/components/ui/badge';
import { MONEY_DONATION_STATUS_CONFIGS, MoneyDonationStatus } from '@/types/common';

interface MoneyDonationStatusBadgeProps {
  status: MoneyDonationStatus | string | undefined | null;
  className?: string;
}

export function MoneyDonationStatusBadge({ status, className }: MoneyDonationStatusBadgeProps) {
  // Handle undefined or null status
  if (!status || !(status in MONEY_DONATION_STATUS_CONFIGS)) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-gray-100 text-gray-800 ${className || ''}`}
      >
        Unknown
      </Badge>
    );
  }

  const validStatus = status as MoneyDonationStatus;
  const config = MONEY_DONATION_STATUS_CONFIGS[validStatus];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className || ''}`}
    >
      {config.text}
    </Badge>
  );
} 