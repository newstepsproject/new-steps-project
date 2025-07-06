'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Hash } from 'lucide-react';
import Link from 'next/link';

interface ShoeDetails {
  _id: string;
  shoeId: number;
  sport: string;
  brand: string;
  modelName: string;
  size: string;
  gender: string;
  condition: string;
  status: string;
  images?: string[];
}

export default function AddRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shoeLoading, setShoeLoading] = useState(false);
  
  // Form state
  const [requestorInfo, setRequestorInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    schoolName: '',
    grade: '',
    sportClub: ''
  });
  
  const [needsShipping, setNeedsShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  
  const [shoeId, setShoeId] = useState('');
  const [shoeDetails, setShoeDetails] = useState<ShoeDetails | null>(null);
  const [shoeError, setShoeError] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch shoe details when shoe ID changes
  useEffect(() => {
    const fetchShoeDetails = async () => {
      if (!shoeId || shoeId.trim() === '') {
        setShoeDetails(null);
        setShoeError('');
        return;
      }

      const numericShoeId = parseInt(shoeId.trim());
      if (isNaN(numericShoeId)) {
        setShoeError('Please enter a valid shoe ID number');
        setShoeDetails(null);
        return;
      }

      setShoeLoading(true);
      setShoeError('');

      try {
        const response = await fetch(`/api/admin/shoes?shoeId=${numericShoeId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 404) {
            setShoeError('Shoe not found. Please check the shoe ID.');
          } else {
            setShoeError('Failed to fetch shoe details');
          }
          setShoeDetails(null);
          return;
        }

        const data = await response.json();
        
        if (data.status !== 'available') {
          setShoeError(`This shoe is not available (Status: ${data.status})`);
          setShoeDetails(null);
          return;
        }

        setShoeDetails(data);
        setShoeError('');
      } catch (error) {
        console.error('Error fetching shoe details:', error);
        setShoeError('Failed to fetch shoe details');
        setShoeDetails(null);
      } finally {
        setShoeLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchShoeDetails, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [shoeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form - only firstName and lastName are required
    if (!requestorInfo.firstName || !requestorInfo.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in first name and last name.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate shipping address if needed
    if (needsShipping) {
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
        toast({
          title: "Validation Error",
          description: "Please fill in all shipping address fields.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validate shoe selection
    if (!shoeDetails) {
      toast({
        title: "Validation Error",
        description: "Please select a valid available shoe.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        requestorInfo,
        shippingInfo: needsShipping ? shippingAddress : null,
        items: [{
          shoeId: shoeDetails.shoeId,
          sport: shoeDetails.sport,
          brand: shoeDetails.brand,
          modelName: shoeDetails.modelName,
          size: shoeDetails.size,
          gender: shoeDetails.gender,
          condition: shoeDetails.condition
        }],
        notes,
        isOffline: true, // Mark as offline/manual entry
        status: 'submitted', // Set initial status
        createdBy: session?.user?.email // Track who created this manual entry
      };

      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create request');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Shoe request has been recorded successfully.",
      });
      
      // Redirect back to requests list
      router.push('/admin/requests');
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Shoe Request</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manually record a shoe request received offline.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requester Information */}
        <Card>
          <CardHeader>
            <CardTitle>Requester Information</CardTitle>
            <CardDescription>
              Enter the requester's contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  type="text"
                  value={requestorInfo.firstName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  type="text"
                  value={requestorInfo.lastName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={requestorInfo.email}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={requestorInfo.phone}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, phone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={requestorInfo.schoolName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, schoolName: e.target.value })}
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={requestorInfo.grade}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, grade: e.target.value })}
                  placeholder="Enter grade level"
                />
              </div>
              <div>
                <Label htmlFor="sportClub">Sport Club</Label>
                <Input
                  id="sportClub"
                  value={requestorInfo.sportClub}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, sportClub: e.target.value })}
                  placeholder="Enter sport club name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address - Optional */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
            <CardDescription>
              This can be an offline transaction. If shipping is needed, please provide the address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsShipping"
                checked={needsShipping}
                onCheckedChange={(checked) => setNeedsShipping(checked as boolean)}
              />
              <Label htmlFor="needsShipping">This request requires shipping</Label>
            </div>
            
            {needsShipping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Street Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    required={needsShipping}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    required={needsShipping}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    required={needsShipping}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code <span className="text-red-500">*</span></Label>
                  <Input
                    id="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                    required={needsShipping}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requested Shoe */}
        <Card>
          <CardHeader>
            <CardTitle>Requested Shoe</CardTitle>
            <CardDescription>
              Enter the shoe ID to automatically retrieve shoe details from inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shoeId">Shoe ID <span className="text-red-500">*</span></Label>
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <Input
                  id="shoeId"
                  type="text"
                  value={shoeId}
                  onChange={(e) => setShoeId(e.target.value)}
                  placeholder="Enter shoe ID (e.g., 101)"
                  className="flex-1"
                />
              </div>
              {shoeLoading && (
                <p className="text-sm text-blue-600 mt-1">Loading shoe details...</p>
              )}
              {shoeError && (
                <div className="flex items-center space-x-2 mt-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <p className="text-sm">{shoeError}</p>
                </div>
              )}
            </div>

            {shoeDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Shoe Found & Available</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Shoe ID</p>
                    <p className="font-medium">#{shoeDetails.shoeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Brand & Model</p>
                    <p className="font-medium">{shoeDetails.brand} {shoeDetails.modelName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sport</p>
                    <p className="font-medium">{shoeDetails.sport}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Size & Gender</p>
                    <p className="font-medium">{shoeDetails.size} ({shoeDetails.gender})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="font-medium">{shoeDetails.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-green-600">{shoeDetails.status}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this request"
                className="h-24"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a manual entry for an offline request. 
                The selected shoe will be marked as "requested" and removed from available inventory.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/requests">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !shoeDetails}>
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </div>
  );
} 