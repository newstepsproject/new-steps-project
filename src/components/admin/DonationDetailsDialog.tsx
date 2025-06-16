'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from './common';
import { Status } from '@/types/common';
import { DONATION_STATUSES } from '@/constants/config';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DonationDetailsDialogProps {
  donation: {
    _id: string;
    donor: {
      name: string;
      email: string;
      phone: string;
    };
    donorAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    items: any[];
    status: Status;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    referenceNumber?: string;
    isBayArea?: boolean;
    numberOfShoes?: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
}

// Define valid status transitions based on constants
const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  submitted: ['received', 'processed', 'cancelled'],
  received: ['processed', 'cancelled'],
  processed: [],
  cancelled: []
};

export default function DonationDetailsDialog({
  donation,
  open,
  onOpenChange,
  onStatusChange,
}: DonationDetailsDialogProps) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState<Status>(donation.status);
  const [notes, setNotes] = useState(donation.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for editable donor information
  const [donorName, setDonorName] = useState(donation.donor?.name || '');
  const [donorEmail, setDonorEmail] = useState(donation.donor?.email || '');
  const [donorPhone, setDonorPhone] = useState(donation.donor?.phone || '');
  
  // Add state for donor address
  const [street, setStreet] = useState(donation.donorAddress?.street || '');
  const [city, setCity] = useState(donation.donorAddress?.city || '');
  const [state, setState] = useState(donation.donorAddress?.state || '');
  const [zipCode, setZipCode] = useState(donation.donorAddress?.zipCode || '');
  const [country, setCountry] = useState(donation.donorAddress?.country || 'USA');
  
  // Add state for other donation details
  const [isBayArea, setIsBayArea] = useState(donation.isBayArea || false);
  const [numberOfShoes, setNumberOfShoes] = useState(donation.numberOfShoes || 
    (donation.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 1));

  // Update ZIP code handler to check for Bay Area status
  const handleZipCodeChange = (zipValue: string) => {
    setZipCode(zipValue);
    if (zipValue.length === 5) {
      // Import from the same constants used in the donation form
      import('@/constants/config').then(({ BAY_AREA_ZIP_CODES }) => {
        setIsBayArea(BAY_AREA_ZIP_CODES.includes(zipValue));
      });
    }
  };

  const handleStatusChange = async () => {
    // Check if any fields have changed
    const isChanged = 
      newStatus !== donation.status || 
      notes !== donation.notes ||
      donorName !== donation.donor?.name ||
      donorEmail !== donation.donor?.email ||
      donorPhone !== donation.donor?.phone ||
      street !== donation.donorAddress?.street ||
      city !== donation.donorAddress?.city ||
      state !== donation.donorAddress?.state ||
      zipCode !== donation.donorAddress?.zipCode ||
      country !== donation.donorAddress?.country ||
      numberOfShoes !== donation.numberOfShoes;
    
    if (!isChanged) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/shoe-donations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          donationId: donation.referenceNumber || donation._id,
          status: newStatus,
          notes,
          donorInfo: {
            name: donorName,
            email: donorEmail,
            phone: donorPhone
          },
          donorAddress: {
            street,
            city,
            state,
            zipCode,
            country
          },
          isBayArea,
          numberOfShoes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update donation');
      }

      toast({
        title: "Donation updated",
        description: `Donation has been successfully updated.`,
      });

      onStatusChange();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update donation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStatuses = STATUS_TRANSITIONS[donation.status] || [];

  // Add function to copy reference number
  const copyReferenceNumber = () => {
    if (donation.referenceNumber) {
      navigator.clipboard.writeText(donation.referenceNumber);
      toast({
        description: "Reference number copied to clipboard",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Donation Details</DialogTitle>
          <DialogDescription>
            View and update donation information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 py-4">
          {/* Reference Number (non-editable) with improved styling */}
          {donation.referenceNumber && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-xs text-gray-500">Reference Number</Label>
                  <p className="font-mono text-base font-medium">{donation.referenceNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyReferenceNumber}
                  title="Copy reference number"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This reference number is generated automatically and cannot be edited.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Donor Information Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-sm">Donor Information</h3>
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="donor-name">Name</Label>
                  <Input 
                    id="donor-name" 
                    value={donorName} 
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Donor name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donor-email">Email</Label>
                  <Input 
                    id="donor-email" 
                    type="email"
                    value={donorEmail} 
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="Donor email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donor-phone">Phone</Label>
                  <Input 
                    id="donor-phone" 
                    value={donorPhone} 
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="Donor phone"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Date Submitted</Label>
                  <p className="text-sm">{formatDate(donation.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Donation Details Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-sm">Donation Details</h3>
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfShoes">Number of Shoes</Label>
                  <Input 
                    id="numberOfShoes" 
                    type="number"
                    min="1"
                    value={numberOfShoes} 
                    onChange={(e) => setNumberOfShoes(Number(e.target.value))}
                    placeholder="Number of shoes"
                  />
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-sm text-blue-700">
                    This donation contains {numberOfShoes} pair{numberOfShoes !== 1 ? 's' : ''} of shoes.
                  </p>
                </div>
              </div>
            </div>

            {/* Donor Address Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-sm">Donor Address</h3>
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input 
                    id="street" 
                    value={street} 
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      value={state} 
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      maxLength={2}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input 
                      id="zipCode" 
                      value={zipCode} 
                      onChange={(e) => handleZipCodeChange(e.target.value)}
                      placeholder="ZIP code"
                      maxLength={5}
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      defaultValue="USA"
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-sm text-blue-700">
                    {isBayArea 
                      ? "Donor is in the Bay Area - can arrange for pickup or drop-off"
                      : "Donor is outside Bay Area - will need shipping instructions"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status and Notes Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-sm">Status and Notes</h3>
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={donation.status} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value as Status)}
                    disabled={availableStatuses.length === 0}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={donation.status}>{donation.status}</SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableStatuses.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">This donation has reached a final status and cannot be updated further.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this donation..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Donation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 