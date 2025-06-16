'use client';

import { Badge } from '@/components/ui/badge';

interface MoneyDonationCardProps {
  donation: {
    _id: string;
    donationId?: string;
    // Support both direct properties and donor object
    name?: string;
    email?: string;
    phone?: string;
    donor?: {
      name: string;
      email: string;
      phone: string;
    };
    amount: number;
    status: string;
    createdAt: string;
    notes?: string;
    checkNumber?: string;
  };
}

// Format currency to USD
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Map status to badge colors
const statusColors = {
  submit: 'bg-blue-100 text-blue-800',
  received: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Status display names
const statusDisplayNames = {
  submit: 'Submitted',
  received: 'Received',
  processed: 'Processed',
  cancelled: 'Cancelled'
};

export function MoneyDonationCard({ donation }: MoneyDonationCardProps) {
  // Handle both direct properties and donor object
  const donorName = donation.donor?.name || donation.name || 'Anonymous Donor';
  const donorEmail = donation.donor?.email || donation.email || '';
  const donorPhone = donation.donor?.phone || donation.phone || '';
  
  return (
    <div className="space-y-3">
      {/* Header with amount and status */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(donation.amount)}
          </p>
          {donation.donationId && (
            <p className="text-xs text-gray-500 font-mono mt-1">
              Ref: {donation.donationId}
            </p>
          )}
        </div>
        <Badge className={statusColors[donation.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
          {statusDisplayNames[donation.status as keyof typeof statusDisplayNames] || donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
        </Badge>
      </div>

      {/* Donor info */}
      <div>
        <h3 className="font-medium text-gray-900">{donorName}</h3>
        {donorEmail && <p className="text-sm text-gray-500">{donorEmail}</p>}
        {donorPhone && <p className="text-sm text-gray-500">{donorPhone}</p>}
        {!donorEmail && !donorPhone && <p className="text-sm text-gray-500 italic">No contact information</p>}
      </div>

      {/* Date */}
      <div className="text-sm text-gray-500">
        Date: {new Date(donation.createdAt).toLocaleDateString()}
      </div>

      {/* Check number if available */}
      {donation.checkNumber && (
        <div className="text-sm text-gray-600">
          Check #: {donation.checkNumber}
        </div>
      )}

      {/* Notes if available */}
      {donation.notes && (
        <div className="text-sm text-gray-600 italic">
          Note: {donation.notes}
        </div>
      )}
    </div>
  );
} 