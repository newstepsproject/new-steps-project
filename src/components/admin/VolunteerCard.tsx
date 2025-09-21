'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, MapPin, Calendar, Phone, Clock } from 'lucide-react';

type VolunteerStatus = 'pending' | 'approved' | 'contacted' | 'rejected' | 'inactive';

interface VolunteerCardVolunteer {
  volunteerId: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  availability?: string;
  interests: string[];
  appliedDate?: string;
  status: VolunteerStatus;
}

interface VolunteerCardProps {
  volunteer: VolunteerCardVolunteer;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onContact?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const statusColors: Record<VolunteerStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  contacted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-200 text-gray-700',
};

export function VolunteerCard({
  volunteer,
  onView,
  onApprove,
  onReject,
  onContact,
  onArchive,
}: VolunteerCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`volunteer-card-${volunteer.volunteerId}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{volunteer.name}</h3>
            <p className="text-sm text-gray-500">{volunteer.volunteerId}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(volunteer.volunteerId)}>
                View Details
              </DropdownMenuItem>
              {volunteer.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => onApprove(volunteer.volunteerId)}>
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReject(volunteer.volunteerId)}>
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {volunteer.status === 'approved' && onContact && (
                <DropdownMenuItem onClick={() => onContact(volunteer.volunteerId)}>
                  Contact
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(volunteer.volunteerId)}>
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <Badge className={statusColors[volunteer.status]}>
            {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
          </Badge>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{volunteer.email}</span>
            </div>
            {volunteer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{volunteer.phone}</span>
              </div>
            )}
            {volunteer.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{volunteer.location}</span>
              </div>
            )}
            {volunteer.availability && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{volunteer.availability}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Interests</p>
            <div className="flex flex-wrap gap-1">
              {volunteer.interests.length === 0 ? (
                <span className="text-xs text-gray-400">No interests provided</span>
              ) : (
                volunteer.interests.map((interest, index) => (
                  <Badge key={`${volunteer.volunteerId}-interest-${index}`} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Applied: {volunteer.appliedDate ?? '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
