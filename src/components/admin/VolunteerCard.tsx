'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, MapPin, Calendar, User } from 'lucide-react';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  location: string;
  interests: string[];
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface VolunteerCardProps {
  volunteer: Volunteer;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onContact?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function VolunteerCard({ 
  volunteer, 
  onView, 
  onApprove, 
  onReject,
  onContact,
  onArchive 
}: VolunteerCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{volunteer.name}</h3>
            <p className="text-sm text-gray-500">{volunteer.id}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(volunteer.id)}>
                View Details
              </DropdownMenuItem>
              {volunteer.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => onApprove(volunteer.id)}>
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReject(volunteer.id)}>
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {volunteer.status === 'approved' && onContact && (
                <DropdownMenuItem onClick={() => onContact(volunteer.id)}>
                  Contact
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(volunteer.id)}>
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge className={statusColors[volunteer.status]}>
              {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{volunteer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{volunteer.location}</span>
            </div>
          </div>

          {/* Interests */}
          <div>
            <p className="text-sm font-medium mb-1">Interests:</p>
            <div className="flex flex-wrap gap-1">
              {volunteer.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Applied: {volunteer.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 