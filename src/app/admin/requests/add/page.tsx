'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { SHOE_BRANDS, SHOE_SPORTS, SHOE_GENDERS, US_MEN_SIZES, US_WOMEN_SIZES, US_YOUTH_SIZES } from '@/constants/config';

interface RequestedShoe {
  name: string;
  sport: string;
  brand: string;
  size: string;
  gender: string;
  notes?: string;
}

export default function AddRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
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
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  
  const [items, setItems] = useState<RequestedShoe[]>([{
    name: '',
    sport: '',
    brand: '',
    size: '',
    gender: '',
    notes: ''
  }]);
  
  const [notes, setNotes] = useState('');

  // Sort brands and sports alphabetically
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));

  const handleAddItem = () => {
    if (items.length >= 2) {
      toast({
        title: "Limit Reached",
        description: "Maximum 2 shoes per request.",
        variant: "destructive",
      });
      return;
    }
    
    setItems([...items, {
      name: '',
      sport: '',
      brand: '',
      size: '',
      gender: '',
      notes: ''
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof RequestedShoe, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getAvailableSizes = (gender: string) => {
    if (gender === 'men') return US_MEN_SIZES;
    if (gender === 'women') return US_WOMEN_SIZES;
    if (gender === 'boys' || gender === 'girls') return US_YOUTH_SIZES;
    return [...US_MEN_SIZES]; // Default
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!requestorInfo.firstName || !requestorInfo.lastName || !requestorInfo.email || !requestorInfo.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required requester information.",
        variant: "destructive",
      });
      return;
    }
    
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Validation Error",
        description: "Please fill in all shipping address fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate items
    const validItems = items.filter(item => item.sport && item.brand && item.size && item.gender);
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one valid shoe request.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          requestorInfo,
          shippingInfo: shippingAddress,
          items: validItems,
          notes,
          isOffline: true, // Mark as offline/manual entry
          status: 'pending', // Set initial status
          createdBy: session?.user?.email // Track who created this manual entry
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create request');
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
        description: "Failed to create request. Please try again.",
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
            Back
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
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={requestorInfo.firstName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={requestorInfo.lastName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={requestorInfo.email}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={requestorInfo.phone}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="schoolName">School Name (Optional)</Label>
                <Input
                  id="schoolName"
                  value={requestorInfo.schoolName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, schoolName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade (Optional)</Label>
                <Input
                  id="grade"
                  value={requestorInfo.grade}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, grade: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="sportClub">Sport Club (Optional)</Label>
                <Input
                  id="sportClub"
                  value={requestorInfo.sportClub}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, sportClub: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription>
              Where should the shoes be shipped?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requested Shoes */}
        <Card>
          <CardHeader>
            <CardTitle>Requested Shoes</CardTitle>
            <CardDescription>
              Add the shoes being requested (maximum 2 per request).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Shoe {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Sport *</Label>
                    <Select
                      value={item.sport}
                      onValueChange={(value) => handleItemChange(index, 'sport', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedSports.map(sport => (
                          <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Brand *</Label>
                    <Select
                      value={item.brand}
                      onValueChange={(value) => handleItemChange(index, 'brand', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Gender *</Label>
                    <Select
                      value={item.gender}
                      onValueChange={(value) => handleItemChange(index, 'gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHOE_GENDERS.map(gender => (
                          <SelectItem key={gender} value={gender}>
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Size *</Label>
                    <Select
                      value={item.size}
                      onValueChange={(value) => handleItemChange(index, 'size', value)}
                      disabled={!item.gender}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={item.gender ? "Select size" : "Select gender first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {item.gender && getAvailableSizes(item.gender).map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Name/Description (Optional)</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="e.g., Nike Air Max 90"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={item.notes || ''}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      placeholder="Any specific requirements or preferences"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {items.length < 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Shoe
              </Button>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this request"
                rows={4}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a manual entry for an offline request. 
                A confirmation email will be sent to the requester if they are a registered user.
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </form>
    </div>
  );
} 