'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Copy, Calendar, DollarSign, User, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Status badge mapping
const statusColors = {
  submit: 'bg-blue-100 text-blue-800 border-blue-200',
  received: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

// Status display names
const statusDisplayNames = {
  submit: 'Submitted',
  received: 'Received',
  processed: 'Processed',
  cancelled: 'Cancelled'
};

// Format currency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

type MoneyDonation = {
  _id?: string;
  donationId: string;
  name: string;
  email?: string;
  phone?: string;
  amount: number;
  status: string;
  createdAt: string;
  notes?: string;
  checkNumber?: string;
  receiptSent?: boolean;
  receiptDate?: Date;
  receivedDate?: Date;
};

interface MoneyDonationDetailsDialogProps {
  donation: MoneyDonation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: string, status: string, notes: string, checkNumber?: string) => void;
}

export default function MoneyDonationDetailsDialog({
  donation,
  open,
  onOpenChange,
  onStatusChange,
}: MoneyDonationDetailsDialogProps) {
  const [status, setStatus] = useState<string>('pending');
  const [notes, setNotes] = useState<string>('');
  const [checkNumber, setCheckNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donorInfo, setDonorInfo] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '' 
  });
  const [amount, setAmount] = useState<number>(0);

  // Update local state when donation changes
  useEffect(() => {
    if (donation) {
      setStatus(donation.status);
      setNotes(donation.notes || '');
      setCheckNumber(donation.checkNumber || '');
      
      // Split existing name into first and last if it exists
      const existingName = donation.name || '';
      const nameParts = existingName.split(' ');
      
      setDonorInfo({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: donation.email || '',
        phone: donation.phone || '',
      });
      setAmount(donation.amount || 0);
    }
  }, [donation]);

  const copyReferenceNumber = () => {
    if (donation?.donationId) {
      navigator.clipboard.writeText(donation.donationId);
      toast({
        description: "Reference number copied to clipboard",
      });
    }
  };

  const handleSubmit = async () => {
    if (!donation) return;
    
    setIsSubmitting(true);
    
    try {
      // Call API to update the donation status
      const response = await fetch(`/api/admin/money-donations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          donationId: donation.donationId,
          status,
          notes,
          checkNumber,
          donorInfo: {
            name: `${donorInfo.firstName} ${donorInfo.lastName}`.trim(),
            email: donorInfo.email,
            phone: donorInfo.phone
          },
          amount
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update donation status');
      }
      
      // Call the onStatusChange callback to refresh the data
      if (onStatusChange) {
        onStatusChange(donation.donationId, status, notes, checkNumber);
      }
      
      // Close the dialog
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Donation updated successfully",
      });
    } catch (error) {
      console.error('Error updating donation status:', error);
      toast({
        title: "Error",
        description: "Failed to update donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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

  if (!donation) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Money Donation Details</DialogTitle>
          <DialogDescription className="text-gray-600">
            View and manage money donation information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6 overflow-y-auto flex-1">
          {/* Reference Number - Prominent Display */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-700">Reference Number</Label>
                  </div>
                  <p className="font-mono text-lg font-bold text-blue-900 tracking-wide">
                    {donation.donationId}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Auto-generated and cannot be edited
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReferenceNumber}
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Donor Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Donor Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="donor-firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="donor-firstName"
                    value={donorInfo.firstName}
                    onChange={(e) => setDonorInfo({ ...donorInfo, firstName: e.target.value })}
                    placeholder="Donor first name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="donor-lastName"
                    value={donorInfo.lastName}
                    onChange={(e) => setDonorInfo({ ...donorInfo, lastName: e.target.value })}
                    placeholder="Donor last name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="donor-email"
                    type="email"
                    value={donorInfo.email}
                    onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                    placeholder="Donor email"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="donor-phone"
                    type="tel"
                    value={donorInfo.phone}
                    onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                    placeholder="Donor phone"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <Label className="text-sm font-medium text-gray-600">Date Submitted</Label>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                    {formatDate(donation.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donation Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-gray-900">Donation Amount</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="donation-amount" className="text-sm font-medium">Amount ($)</Label>
                  <div className="flex items-center mt-2">
                    <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md text-gray-600 font-medium">
                      $
                    </span>
                    <Input
                      id="donation-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="rounded-l-none h-10"
                    />
                  </div>
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Current amount:</span> {formatCurrency(amount)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Current Status</Label>
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[donation.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'} font-medium`}
                    >
                      {statusDisplayNames[donation.status as keyof typeof statusDisplayNames] || donation.status}
                    </Badge>
                  </div>
                  <Label htmlFor="status-select" className="text-sm font-medium">New Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status-select" className="w-full mt-2 h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submit">Submitted</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                    💡 Changing status may trigger additional actions like receipt emails.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="checkNumber" className="text-sm font-medium">Check Number</Label>
                  <Input
                    id="checkNumber"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Enter check number if applicable"
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this donation..."
                    className="min-h-[100px] resize-none text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <DialogFooter className="gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-10 px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Donation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 