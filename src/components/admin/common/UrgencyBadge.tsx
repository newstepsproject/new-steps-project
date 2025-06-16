'use client';

import { Badge } from '@/components/ui/badge';
import { RequestUrgency } from '@/types/common';

const urgencyColors: Record<RequestUrgency, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-rose-100 text-rose-800',
};

interface UrgencyBadgeProps {
  urgency: RequestUrgency | undefined;
  className?: string;
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  // Handle undefined or null urgency
  if (!urgency) {
    return (
      <Badge className={`bg-gray-100 text-gray-800 ${className || ''}`}>
        Unknown
      </Badge>
    );
  }

  return (
    <Badge className={`${urgencyColors[urgency]} ${className || ''}`}>
      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
    </Badge>
  );
} 