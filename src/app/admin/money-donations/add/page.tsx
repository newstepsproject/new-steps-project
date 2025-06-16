'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MoneyDonationStatus } from '@/types/common';

// Status display names
const statusDisplayNames = {
  submit: 'Submitted',
  received: 'Received',
  processed: 'Processed',
  cancelled: 'Cancelled'
};

export default function AddMoneyDonationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [amount, setAmount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<MoneyDonationStatus>('processed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form - only name is required
    if (!donorInfo.name) {
      toast({
        title: "Validation Error",
        description: "Please enter the donor's name.",
        variant: "destructive",
      });
      return;
    }
    
    const donationAmount = parseFloat(amount);
    if (!amount || isNaN(donationAmount) || donationAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/money-donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          donorInfo,
          amount: donationAmount,
          checkNumber,
          notes,
          isOffline: true, // Mark as offline/manual entry
          status, // Use the selected status
          createdBy: session?.user?.email // Track who created this manual entry
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create donation');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Money donation has been recorded successfully.",
      });
      
      // Redirect back to donations list
      router.push('/admin/money-donations');
    } catch (error) {
      console.error('Error creating donation:', error);
      toast({
        title: "Error",
        description: "Failed to create donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/money-donations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Money Donation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manually record a money donation received offline.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Donor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Information</CardTitle>
            <CardDescription>
              Enter the donor's contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={donorInfo.name}
                  onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                  required
                  className="h-10"
                  placeholder="Enter donor's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={donorInfo.email}
                  onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                  className="h-10"
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={donorInfo.phone}
                  onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                  className="h-10"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Details</CardTitle>
            <CardDescription>
              Enter the donation amount, status, and payment details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-medium">
                  Amount ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="h-10"
                />
                <p className="text-xs text-gray-500">Enter the donation amount in USD</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkNumber" className="font-medium">
                  Check Number (Optional)
                </Label>
                <Input
                  id="checkNumber"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="e.g., 1234"
                  className="h-10"
                />
                <p className="text-xs text-gray-500">If the donation was made by check</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">
                  Status
                </Label>
                <Select 
                  value={status} 
                  onValueChange={(value) => setStatus(value as MoneyDonationStatus)}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submit">Submitted</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {status === 'submit' && 'Donation has been submitted but not yet received'}
                  {status === 'received' && 'Donation has been received but not yet processed'}
                  {status === 'processed' && 'Donation has been received and processed'}
                  {status === 'cancelled' && 'Donation has been cancelled'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this donation"
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a manual entry for an offline donation. 
                By default, the status is set to "processed". You can change the status if needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/money-donations">
            <Button type="button" variant="outline" className="h-10">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="h-10 px-6">
            {loading ? 'Creating...' : 'Create Donation'}
          </Button>
        </div>
      </form>
    </div>
  );
} 