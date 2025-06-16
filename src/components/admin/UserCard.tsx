'use client';

import { Badge } from '@/components/ui/badge';
import { RoleBadge } from './common';
import { UserRole } from '@/types/user';
import { User, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface UserCardProps {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: UserRole;
    createdAt: string;
    emailVerified: boolean;
    schoolName?: string;
    grade?: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const fullName = `${user.firstName} ${user.lastName}`;
  
  return (
    <div className="space-y-3">
      {/* Header with name and role */}
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{fullName}</h3>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>
        <Badge 
          variant={user.emailVerified ? "brand" : "destructive"}
          className="flex items-center gap-1"
        >
          {user.emailVerified ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Verified
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              Unverified
            </>
          )}
        </Badge>
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{user.phone}</span>
          </div>
        )}
      </div>

      {/* Additional info */}
      <div className="flex flex-wrap gap-2 text-sm">
        {user.schoolName && (
          <Badge variant="outline" className="text-xs">
            {user.schoolName}
          </Badge>
        )}
        {user.grade && (
          <Badge variant="outline" className="text-xs">
            Grade {user.grade}
          </Badge>
        )}
      </div>

      {/* Join date */}
      <div className="flex items-center text-sm text-gray-500">
        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
        Joined {new Date(user.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
} 