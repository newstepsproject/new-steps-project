'use client';

import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './common';
import { Status } from '@/types/common';

interface DonationCardProps {
  donation: {
    _id: string;
    donor: {
      name: string;
      email: string;
      phone: string;
    };
    items: {
      brand: string;
      size: string;
      condition: string;
      quantity: number;
    }[];
    status: string;
    createdAt: string;
    notes?: string;
    referenceNumber?: string;
    pickupPreference?: string;
  };
}

export function DonationCard({ donation }: DonationCardProps) {
  return (
    <div className="space-y-3">
      {/* Header with donor info and status */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{donation.donor?.name || 'Unknown Donor'}</h3>
          <p className="text-sm text-gray-500">{donation.donor?.email || 'No email'}</p>
          <p className="text-sm text-gray-500">{donation.donor?.phone || 'No phone'}</p>
          {donation.referenceNumber && (
            <p className="text-sm text-gray-700 font-semibold mt-1">Ref: {donation.referenceNumber}</p>
          )}
        </div>
        <StatusBadge status={donation.status as Status} />
      </div>

      {/* Items */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Items:</p>
        {donation.items?.map((item, index) => (
          <div key={index} className="text-sm text-gray-600">
            {item.quantity}x {item.brand} (Size {item.size}, {item.condition})
          </div>
        )) || <div className="text-sm text-gray-500">No items</div>}
      </div>

      {donation.pickupPreference && (
        <div className="text-sm text-gray-600">
          Preference: {donation.pickupPreference === 'pickup' ? 'Volunteer pickup' : donation.pickupPreference === 'dropoff' ? 'Donor drop-off' : 'Ship to warehouse'}
        </div>
      )}

      {/* Date */}
      <div className="text-sm text-gray-500">
        Created: {new Date(donation.createdAt).toLocaleDateString()}
      </div>

      {/* Notes if available */}
      {donation.notes && (
        <div className="text-sm text-gray-600 italic">
          Note: {donation.notes}
        </div>
      )}
    </div>
  );
} 
