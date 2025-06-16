'use client';

import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/user';

// Role badge mapping
const roleColors = {
  [UserRole.USER]: 'bg-blue-100 text-blue-800',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
  [UserRole.SUPERADMIN]: 'bg-red-100 text-red-800',
};

interface RoleBadgeProps {
  role: UserRole | undefined | null;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  // Handle undefined or null role
  if (!role) {
    return (
      <Badge 
        className={`bg-gray-100 text-gray-800 ${className || ''}`}
      >
        Unknown
      </Badge>
    );
  }

  return (
    <Badge 
      className={`${roleColors[role] || 'bg-gray-100 text-gray-800'} ${className || ''}`}
    >
      {role}
    </Badge>
  );
} 