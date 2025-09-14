'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, ChevronLeft, Package, TruckIcon, HomeIcon, Check, Loader2, Hash, DollarSign, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

// Manual payment coordination - no PayPal integration needed

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, clearCart, itemCount, removeItem } = useCart();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    deliveryMethod: 'shipping',
    notes: '',
    shippingPaymentAgreed: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [requestId, setRequestId] = useState('');
  
  // Payment state (simplified for manual coordination)
  // PayPal-related state removed - using manual payment coordination
  
  // Calculate order totals - SIMPLIFIED LOGIC
  const [shippingFee, setShippingFee] = useState(5); // Default value
  const shippingCost = formData.deliveryMethod === 'pickup' ? 0 : shippingFee;
  const totalCost = shippingCost;
  const needsPayment = totalCost > 0;

  // Load shipping fee from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setShippingFee(settings.shippingFee || 5);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Keep default value of 5
      }
    };
    
    loadSettings();
  }, []);

  // Manual payment coordination - no SDK loading needed

  // Reset payment when shipping changes
  useEffect(() => {
    if (!needsPayment) {
      // No payment needed for pickup
      console.log('No payment needed - pickup selected');
    }
  }, [needsPayment]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (status === 'unauthenticated') {
      // Redirect to login with callback URL
      const callbackUrl = encodeURIComponent('/checkout');
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }
  }, [status, router]);

  // Auto-fill form with user data when session is available
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.firstName || prev.firstName,
        lastName: session.user.lastName || prev.lastName,
        email: session.user.email || prev.email,
        phone: session.user.phone || prev.phone,
      }));
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDeliveryMethodChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      deliveryMethod: value,
      shippingPaymentAgreed: false // Reset agreement when method changes
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    // Only validate shipping address if shipping is selected
    if (formData.deliveryMethod === 'shipping') {
      if (!formData.address.trim()) newErrors.address = 'Address is required for shipping';
      if (!formData.city.trim()) newErrors.city = 'City is required for shipping';
      if (!formData.state.trim()) newErrors.state = 'State is required for shipping';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required for shipping';
      
      // Validate shipping payment agreement
      if (needsPayment && !formData.shippingPaymentAgreed) {
        newErrors.shippingPaymentAgreed = 'Please agree to the shipping payment terms';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the cart is empty
    if (itemCount === 0) {
      setFormError('Your cart is empty. Please add some items before checking out.');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      setFormError('Please fix the errors in the form before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      console.log('Submitting shoe request with data:', { ...formData, items });
      
      // Submit to the proper authenticated API endpoint
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          shippingPaymentMethod: needsPayment ? 'manual_coordination' : 'none',
          shippingPaymentAgreed: formData.shippingPaymentAgreed,
          items: items.map(item => ({
            shoeId: item.shoeId,
            inventoryId: item.inventoryId, // MongoDB ObjectId - use correct field
            brand: item.brand,
            name: item.name,
            size: item.size ?? 'N/A',        // Apply nullish coalescing to handle null values
            gender: item.gender ?? 'unisex',  // Apply nullish coalescing to handle null values
            sport: item.sport,
            condition: item.condition,
            notes: ''
          })),
        }),
      });
      
      console.log('Request submission response status:', response.status);
      const data = await response.json();
      console.log('Request submission response data:', data);
      
      if (!response.ok) {
        if (response.status === 401) {
          setFormError('Please sign in to submit your request.');
          return;
        }
        throw new Error(data.error || 'Failed to submit request');
      }
      
      // Show success toast
      toast({
        title: 'Request Submitted',
        description: 'Your shoe request has been submitted successfully.',
        variant: 'default',
      });
      
      // Set request ID from response
      setRequestId(data.requestId || 'Unknown');
      
      // Clear the cart
      clearCart();
      
      // Mark as submitted
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting request:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show success page if submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Submitted!</h1>
              <p className="text-gray-600">Your shoe request has been submitted successfully.</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Request ID:</p>
              <p className="text-lg font-mono font-semibold text-gray-900">{requestId}</p>
            </div>
            
            {needsPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Payment Coordination</h3>
                <p className="text-sm text-blue-800">
                  You will receive an email from <strong>newstepsfit@gmail.com</strong> within 24 hours 
                  with instructions to coordinate your $5 shipping payment.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/account">View My Requests</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/shoes">Browse More Shoes</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/cart" className="inline-flex items-center text-brand hover:text-brand-dark">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-brand" />
              Order Summary
            </h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.imageUrl || '/images/placeholder-shoe.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-mono text-gray-500">ID: {item.shoeId}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{item.brand} {item.name}</h3>
                    <p className="text-sm text-gray-600">
                      Size {item.size} • {item.gender} • {item.sport}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{item.condition} condition</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.size)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Delivery Method Selection */}
            <div className="border-t pt-4 mb-4">
              <h3 className="font-medium mb-3">Delivery Method</h3>
              <RadioGroup value={formData.deliveryMethod} onValueChange={handleDeliveryMethodChange}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <HomeIcon className="h-4 w-4 mr-2 text-green-600" />
                        <span>Local Pickup</span>
                      </div>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Our project organizer will contact you at <strong>newstepsfit@gmail.com</strong> to coordinate pickup location and time</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="shipping" id="shipping" />
                  <Label htmlFor="shipping" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TruckIcon className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Standard Shipping</span>
                      </div>
                      <span className="text-blue-600 font-medium">${shippingFee.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Delivered to your address</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Pickup Coordination Information */}
            {formData.deliveryMethod === 'pickup' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <HomeIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-green-900 font-medium mb-2">Pickup Coordination</h4>
                    <p className="text-green-800 text-sm mb-2">
                      After you submit your request, our project organizer will contact you within 24 hours to coordinate the pickup details.
                    </p>
                    <div className="bg-green-100 rounded p-2">
                      <p className="text-green-900 text-sm font-medium">
                        📧 Contact: <strong>newstepsfit@gmail.com</strong>
                      </p>
                      <p className="text-green-800 text-xs mt-1">
                        We'll arrange a convenient pickup location and time that works for both parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Cost:</span>
                <span className={totalCost > 0 ? 'text-blue-600' : 'text-green-600'}>
                  {totalCost > 0 ? `$${totalCost.toFixed(2)}` : 'Free'}
                </span>
              </div>
              {totalCost > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Shipping fee: ${shippingCost.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-brand" />
              Request Information
            </h2>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-medium mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(123) 456-7890 (optional)"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address - Only show if shipping is selected */}
              {formData.deliveryMethod === 'shipping' && (
                <div>
                  <h3 className="font-medium mb-3">Shipping Address</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={errors.address ? 'border-red-500' : ''}
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={errors.city ? 'border-red-500' : ''}
                        />
                        {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={errors.state ? 'border-red-500' : ''}
                        />
                        {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code <span className="text-red-500">*</span></Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className={errors.zipCode ? 'border-red-500' : ''}
                        />
                        {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special instructions or information we should know"
                  value={formData.notes}
                  onChange={handleChange}
                  className="min-h-[100px]"
                />
              </div>
              
              {/* Shipping Payment Agreement Section */}
              {needsPayment && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-brand" />
                    Shipping Payment - ${totalCost.toFixed(2)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    A shipping fee of ${shippingCost.toFixed(2)} is required for standard shipping.
                    You will be contacted by our team to coordinate payment.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="shippingPaymentAgreed"
                        checked={formData.shippingPaymentAgreed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingPaymentAgreed: e.target.checked
                        }))}
                        className="mt-1 mr-3 h-4 w-4 text-brand border-gray-300 rounded focus:ring-brand"
                      />
                      <div className="flex-1">
                        <label htmlFor="shippingPaymentAgreed" className="text-sm font-medium text-blue-900 cursor-pointer">
                          I agree to coordinate the $5 shipping payment with the New Steps team
                        </label>
                        <p className="text-xs text-blue-700 mt-1">
                          You will receive an email from <strong>newstepsfit@gmail.com</strong> within 24 hours with payment instructions. 
                          We accept Venmo, Zelle, PayPal, or check payments.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {formData.shippingPaymentAgreed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Payment Agreement Confirmed</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        You can now complete your shoe request. We'll contact you about payment coordination.
                      </p>
                    </div>
                  )}
                  
                  {errors.shippingPaymentAgreed && (
                    <p className="text-red-500 text-sm mt-2">{errors.shippingPaymentAgreed}</p>
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg" 
                  disabled={isSubmitting || items.length === 0 || (needsPayment && !formData.shippingPaymentAgreed)}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Package className="h-5 w-5 mr-2" />
                  )}
                  {isSubmitting ? 'Processing...' : 
                   needsPayment && !formData.shippingPaymentAgreed ? 'Please Agree to Payment Terms' : 
                   'Complete Request'}
                </Button>
                {needsPayment && !formData.shippingPaymentAgreed && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please agree to the shipping payment terms above to complete your request
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
