'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, ChevronLeft, Package, TruckIcon, HomeIcon, CreditCard, Check, Loader2, Hash, DollarSign, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
// Removed direct settings import - using API instead

// PayPal payment response type
interface PayPalPaymentResult {
  orderID: string;
  payerID?: string;
  status: string;
}

// Global flag to prevent duplicate PayPal initialization
let globalPayPalInitialized = false;

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, clearCart, itemCount, removeItem } = useCart();
  const router = useRouter();
  const paypalRef = useRef<HTMLDivElement>(null);
  
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
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [requestId, setRequestId] = useState('');
  
  // Payment state
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PayPalPaymentResult | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalButtonsInitialized, setPaypalButtonsInitialized] = useState(false);
  const [isInitializingPaypal, setIsInitializingPaypal] = useState(false);
  const [lastInitAttempt, setLastInitAttempt] = useState(0);
  
  // PayPal script ref to track script element
  const paypalScriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Calculate order totals - SIMPLIFIED LOGIC
  const [shippingFee, setShippingFee] = useState(5); // Default value
  const shippingCost = formData.deliveryMethod === 'pickup' ? 0 : shippingFee;
  const totalCost = shippingCost;
  const needsPayment = totalCost > 0;

  // Load shipping fee from settings
  useEffect(() => {
    const loadShippingFee = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const settings = await response.json();
        setShippingFee(settings.shippingFee || 5);
      } catch (error) {
        console.error('Error loading shipping fee setting:', error);
        setShippingFee(5); // Keep default value
      }
    };
    
    loadShippingFee();
  }, []);

  // Debug shipping calculation
  console.log('Shipping Calculation Debug:', {
    deliveryMethod: formData.deliveryMethod,
    shippingCost,
    totalCost,
    needsPayment
  });

  // Load PayPal SDK
  useEffect(() => {
    if (needsPayment && !paypalLoaded) {
      // Check if we have a valid PayPal client ID
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      if (!clientId || clientId === 'test' || clientId.length < 20 || clientId.includes('AZHWGKdx9_SHZr7rBP3IYlsKgmyv5aDl5LJ4J4SjKm5FGqvJ1_8Gm9qQZ0vLXnNZ_l6C8OKqJvXQQ9qD')) {
        console.warn('Using placeholder PayPal client ID - skipping PayPal integration for testing');
        setFormError('PayPal not configured. Please use "Pickup (Free)" option for testing.');
        return;
      }
      
      // Check if PayPal SDK is already loaded globally
      if ((window as any).paypal) {
        console.log('PayPal SDK already available globally');
        setPaypalLoaded(true);
        return;
      }
      
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        console.log('PayPal script already exists, waiting for load...');
        existingScript.addEventListener('load', () => {
          setPaypalLoaded(true);
        });
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&enable-funding=venmo&disable-funding=paylater,credit&components=buttons&intent=capture&currency=USD&locale=en_US`;
      script.async = true;
      script.onload = () => {
        setPaypalLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        setPaypalLoaded(false);
        setFormError('Failed to load PayPal. Please refresh the page.');
      };
      
      // Store script reference
      paypalScriptRef.current = script;
      document.head.appendChild(script); // Use head instead of body
      
      return () => {
        // Much safer cleanup - don't remove script at all during development
        if (paypalScriptRef.current) {
          paypalScriptRef.current.onload = null;
          paypalScriptRef.current.onerror = null;
          // Don't remove script - let browser handle it naturally
          console.debug('PayPal script cleanup - handlers cleared');
        }
        paypalScriptRef.current = null;
        // Don't reset paypalLoaded here to prevent re-loading
      };
    }
  }, [needsPayment, paypalLoaded]);

  // Manual reset function for PayPal buttons
  const resetPayPalButtons = () => {
    console.log('Manually resetting PayPal buttons...');
    setPaypalButtonsInitialized(false);
    setIsInitializingPaypal(false);
    setPaymentCompleted(false);
    setPaymentDetails(null);
    setLastInitAttempt(0); // Reset cooldown timer
    globalPayPalInitialized = false; // Reset global flag
    
    // Don't clear container manually - this can cause DOM removal errors
    // Let the useEffect handle re-initialization with proper timing
    
    toast({
      title: 'Payment Buttons Reset',
      description: 'Payment buttons have been reset. You can try again.',
      variant: 'default',
    });
  };

  // Initialize PayPal buttons
  const initializePayPalButtons = () => {
    const now = Date.now();
    const cooldownPeriod = 2000; // 2 seconds between attempts
    
    console.log('Initializing PayPal buttons...', {
      paypalRefExists: !!paypalRef.current,
      paypalSDKLoaded: !!(window as any).paypal,
      needsPayment,
      totalCost,
      alreadyInitialized: paypalButtonsInitialized,
      isInitializing: isInitializingPaypal,
      globalFlag: globalPayPalInitialized,
      timeSinceLastAttempt: now - lastInitAttempt
    });
    
    // Prevent duplicate initialization and add cooldown
    if (isInitializingPaypal || paypalButtonsInitialized || globalPayPalInitialized) {
      console.log('PayPal initialization already in progress or completed (including global check)');
      return;
    }
    
    // Cooldown period to prevent rapid re-initialization
    if (now - lastInitAttempt < cooldownPeriod) {
      console.log('PayPal initialization cooldown active, skipping...');
      return;
    }
    
    if (paypalRef.current && (window as any).paypal && needsPayment) {
      // Extra check: if PayPal buttons already exist, don't initialize
      if (paypalRef.current.innerHTML.includes('paypal-buttons') || 
          paypalRef.current.innerHTML.includes('paypal-button') ||
          paypalRef.current.innerHTML.includes('data-paypal-button') ||
          paypalRef.current.childNodes.length > 0) {
        console.log('PayPal buttons already exist in container, marking as initialized');
        setPaypalButtonsInitialized(true);
        setIsInitializingPaypal(false);
        globalPayPalInitialized = true;
        return;
      }
      
      setIsInitializingPaypal(true);
      setLastInitAttempt(now);
      globalPayPalInitialized = true; // Set global flag
      
      try {
        // Don't clear container aggressively - let PayPal handle its own cleanup
        console.log('Initializing PayPal buttons in container...');
        
        (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            height: 45,
            tagline: false,
            fundingicons: false
          },
          createOrder: (data: any, actions: any) => {
            console.log('PayPal createOrder called', { totalCost, formData });
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: totalCost.toFixed(2),
                  currency_code: 'USD'
                },
                description: `New Steps Project - Shipping Fee for ${itemCount} shoes`
              }],
              application_context: {
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'New Steps Project',
                landing_page: 'LOGIN'
              }
            });
          },
          onApprove: (data: any, actions: any) => {
            console.log('PayPal onApprove called', data);
            console.log('PayPal actions available:', Object.keys(actions));
            return actions.order.capture().then((details: any) => {
              console.log('Payment completed successfully:', details);
              setPaymentCompleted(true);
              setPaymentDetails({
                orderID: data.orderID,
                payerID: data.payerID,
                status: details.status
              });
              toast({
                title: 'Payment Successful!',
                description: `Payment of $${totalCost.toFixed(2)} completed. You can now submit your request.`,
                variant: 'default',
              });
            }).catch((captureError: any) => {
              console.error('Error capturing PayPal payment:', captureError);
              toast({
                title: 'Payment Capture Error',
                description: 'Payment was approved but could not be completed. Please try again.',
                variant: 'destructive',
              });
            });
          },
          onError: (err: any) => {
            console.error('PayPal payment error details:', err);
            console.error('Error type:', typeof err);
            console.error('Error message:', err.message || 'No message');
            console.error('Error stack:', err.stack || 'No stack');
            
            // Reset PayPal button state to allow retry after error
            setPaypalButtonsInitialized(false);
            setIsInitializingPaypal(false);
            globalPayPalInitialized = false; // Reset global flag
            
            // Don't clear container aggressively - let PayPal handle cleanup
            console.log('PayPal payment error - states reset');
            
            toast({
              title: 'Payment Error',
              description: `There was an error processing your payment: ${err.message || 'Unknown error'}. Please try again.`,
              variant: 'destructive',
            });
          },
          onCancel: (data: any) => {
            console.log('PayPal payment cancelled by user:', data);
            
            // Reset PayPal button state to allow new attempts after a delay
            setPaypalButtonsInitialized(false);
            setIsInitializingPaypal(false);
            globalPayPalInitialized = false; // Reset global flag
            
            // Don't clear container aggressively - this causes the DOM removal error
            // Let PayPal handle its own cleanup naturally
            console.log('PayPal payment cancelled - states reset');
            
            toast({
              title: 'Payment Cancelled',
              description: 'Payment was cancelled. You can try again when ready.',
              variant: 'default',
            });
          }
        }).render(paypalRef.current).then(() => {
          setPaypalButtonsInitialized(true);
          setIsInitializingPaypal(false);
          console.log('PayPal buttons rendered successfully');
          
          // Debug: Check if buttons are actually in the DOM
          setTimeout(() => {
            if (paypalRef.current) {
              console.log('PayPal container content after render:', {
                innerHTML: paypalRef.current.innerHTML.substring(0, 200) + '...',
                childNodes: paypalRef.current.childNodes.length,
                hasPayPalElements: paypalRef.current.innerHTML.includes('paypal')
              });
            }
          }, 500);
        }).catch((renderError: any) => {
          console.error('Error rendering PayPal buttons:', renderError);
          setPaypalButtonsInitialized(false);
          setIsInitializingPaypal(false);
          setLastInitAttempt(0); // Reset cooldown on error
          globalPayPalInitialized = false; // Reset global flag
          toast({
            title: 'PayPal Error',
            description: 'Failed to load payment options. Please refresh the page.',
            variant: 'destructive',
          });
        });
        
      } catch (error) {
        console.error('Error rendering PayPal buttons:', error);
        setPaypalButtonsInitialized(false);
        setIsInitializingPaypal(false);
        setLastInitAttempt(0); // Reset cooldown on error
        globalPayPalInitialized = false; // Reset global flag
        toast({
          title: 'PayPal Error',
          description: 'Failed to load payment options. Please refresh the page.',
          variant: 'destructive',
        });
      }
    } else {
      console.log('PayPal buttons not rendered:', {
        paypalRef: !!paypalRef.current,
        paypalSDK: !!(window as any).paypal,
        needsPayment,
        isInitializing: isInitializingPaypal
      });
    }
  };

  // Reset payment when shipping changes
  useEffect(() => {
    if (!needsPayment) {
      setPaymentCompleted(true); // No payment needed for free shipping
      setPaymentDetails(null);
      setIsInitializingPaypal(false);
      setLastInitAttempt(0);
      // Don't reset PayPal buttons immediately - let them clean up naturally
    } else {
      setPaymentCompleted(false);
      setPaymentDetails(null);
      setIsInitializingPaypal(false);
      setLastInitAttempt(0);
      // Reset buttons only when switching to payment mode
      setPaypalButtonsInitialized(false);
    }
  }, [needsPayment]);

  // Debug PayPal payment section rendering
  useEffect(() => {
    if (needsPayment) {
      console.log('PayPal Payment Section Rendered:', { 
        needsPayment, 
        totalCost, 
        paymentCompleted,
        paypalLoaded,
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.substring(0, 20) + '...'
      });
    }
  }, [needsPayment, totalCost, paymentCompleted, paypalLoaded]);

  // Initialize PayPal buttons when SDK loads or payment requirements change
  useEffect(() => {
    console.log('PayPal useEffect triggered:', {
      paypalLoaded,
      needsPayment,
      paypalRefExists: !!paypalRef.current,
      totalCost,
      paypalButtonsInitialized,
      isInitializingPaypal,
      timeSinceLastAttempt: Date.now() - lastInitAttempt,
      containerHasContent: paypalRef.current ? paypalRef.current.childNodes.length > 0 : false
    });
    
    if (paypalLoaded && needsPayment && paypalRef.current && !paypalButtonsInitialized && !isInitializingPaypal) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializePayPalButtons();
      }, 100);
    } else {
      console.log('PayPal initialization skipped because:', {
        paypalLoaded: !paypalLoaded ? 'PayPal not loaded' : 'OK',
        needsPayment: !needsPayment ? 'No payment needed' : 'OK', 
        paypalRef: !paypalRef.current ? 'paypalRef.current is null' : 'OK',
        alreadyInitialized: paypalButtonsInitialized ? 'Already initialized' : 'OK',
        isInitializing: isInitializingPaypal ? 'Currently initializing' : 'OK'
      });
    }
  }, [paypalLoaded, needsPayment, paypalButtonsInitialized, isInitializingPaypal]);

  // Cleanup PayPal buttons when component unmounts
  useEffect(() => {
    return () => {
      // Component cleanup - avoid any DOM manipulation
      console.log('Component unmounting - PayPal cleanup');
      // Let React handle all DOM cleanup naturally
      // Don't touch PayPal elements directly
    };
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle radio button changes
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryMethod: value
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    
    // Add address fields ONLY if standard shipping is selected
    if (formData.deliveryMethod === 'shipping') {
      requiredFields.push('address', 'city', 'state', 'zipCode');
    }
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone format
    if (formData.phone && !/^[0-9()\-\s+]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
          items: items.map(item => ({
            shoeId: item.shoeId,
            inventoryId: item.id, // MongoDB ObjectId
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
      
      // Clear the cart and show success message
      clearCart();
      setIsSubmitted(true);
      
      // Reset form data
      setFormData({
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
      });
      
    } catch (error) {
      console.error('Error submitting request:', error);
      setFormError('There was an error processing your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show sign-in prompt if not authenticated (enabled for production)
  if (status === 'unauthenticated' && !isSubmitting && !isSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to your account to request shoes. We need to verify your account 
            to ensure fair distribution of our limited inventory.
          </p>
          <Button asChild>
            <Link href={`/login?callbackUrl=${encodeURIComponent('/checkout')}`}>
              Sign In to Continue
            </Link>
          </Button>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href={`/register?callbackUrl=${encodeURIComponent('/checkout')}`} className="text-brand hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show confirmation screen after successful submission
  if (isSubmitted) {
    return (
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Request Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your request. We will process it as soon as possible.
              You will receive a confirmation email shortly.
            </p>
            <div className="mb-8 max-w-sm mx-auto py-4 px-6 bg-gray-50 rounded-lg">
              <p className="font-medium mb-1">Request Reference Number:</p>
              <p className="text-gray-700 font-mono bg-gray-100 py-1 px-2 rounded">{requestId}</p>
              <p className="font-medium mt-4 mb-1">Delivery Method:</p>
              <p className="text-gray-700">{formData.deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/">
                  Return to Home
                </Link>
              </Button>
              <Button asChild>
                <Link href="/shoes">
                  Browse More Shoes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex-1 bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/shoes" className="text-gray-500 hover:text-brand flex items-center text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Continue Shopping
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Your Request</h2>
              
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">
                    Your cart is empty
                  </p>
                  <Button asChild>
                    <Link href="/shoes">
                      Browse Shoes
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex border-b pb-4">
                        <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          {/* Prominent Shoe ID Badge */}
                          <div className="absolute top-1 left-1 bg-brand text-white px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                            {item.shoeId}
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-medium text-sm">{item.name}</h3>
                            <div className="ml-2 text-right">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700 text-xs font-medium"
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{item.brand}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {item.gender}
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Size {item.size}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${totalCost.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 pt-2">
                      <p>* Shoes are provided at no cost</p>
                      <p>* Standard shipping: ${shippingFee.toFixed(2)} flat rate</p>
                      <p>* Free pickup in Bay Area</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Checkout Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-md">
                    {formError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? 'border-red-300' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? 'border-red-300' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-red-300' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'border-red-300' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Delivery Method</h3>
                  <RadioGroup 
                    value={formData.deliveryMethod} 
                    onValueChange={handleRadioChange}
                    className="space-y-3"
                  >
                    <div className={`flex items-start space-x-3 border rounded-lg p-4 ${formData.deliveryMethod === 'shipping' ? 'border-brand bg-brand-50' : 'border-gray-200'}`}>
                      <RadioGroupItem value="shipping" id="shipping" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="shipping" className="flex items-center">
                          <TruckIcon className="h-5 w-5 mr-2 text-brand" />
                          <span className="font-medium">Standard Shipping</span>
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Flat rate shipping of ${shippingFee.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start space-x-3 border rounded-lg p-4 ${formData.deliveryMethod === 'pickup' ? 'border-brand bg-brand-50' : 'border-gray-200'}`}>
                      <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="pickup" className="flex items-center">
                          <HomeIcon className="h-5 w-5 mr-2 text-brand" />
                          <span className="font-medium">Pickup (Free)</span>
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Free pickup in Bay Area
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                
                {formData.deliveryMethod === 'shipping' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
                    
                    <div className="mb-4">
                      <Label htmlFor="address">Street Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={errors.address ? 'border-red-300' : ''}
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={errors.city ? 'border-red-300' : ''}
                        />
                        {errors.city && (
                          <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={errors.state ? 'border-red-300' : ''}
                        />
                        {errors.state && (
                          <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                        )}
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
                          className={errors.zipCode ? 'border-red-300' : ''}
                        />
                        {errors.zipCode && (
                          <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>
                        )}
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
                )}
                
                <div className="mb-6">
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
                
                {/* PayPal Payment Section */}
                {needsPayment && (
                  <div className="border-t pt-6 mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-brand" />
                      Payment Required - ${totalCost.toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      A shipping fee of ${shippingCost.toFixed(2)} is required for standard shipping.
                      You can pay securely using PayPal or Venmo.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>For athletes under 18:</strong> Please ask a parent or guardian to complete the payment.
                        PayPal requires users to be 18+ for account creation, but parents can pay on behalf of minors.
                      </p>
                    </div>
                    
                    {!paymentCompleted ? (
                      <div>
                        <div 
                          ref={(el) => {
                            if (el) {
                              // Use the callback ref properly
                              Object.defineProperty(paypalRef, 'current', {
                                value: el,
                                writable: true
                              });
                              console.log('PayPal div ref set:', {
                                element: !!el,
                                paypalLoaded,
                                needsPayment,
                                paymentCompleted
                              });
                              
                              // Try to initialize PayPal buttons if everything is ready
                              if (paypalLoaded && needsPayment && !paymentCompleted) {
                                console.log('Triggering PayPal initialization from ref callback...');
                                setTimeout(() => {
                                  initializePayPalButtons();
                                }, 100);
                              }
                            }
                          }}
                          className="mb-4 min-h-[60px] border border-gray-200 rounded-lg p-2"
                        >
                          {!paypalLoaded && (
                            <div className="text-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto text-brand mb-2" />
                              <p className="text-sm text-gray-500">Loading PayPal...</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          After completing payment, you'll be able to submit your shoe request.
                        </p>
                        <div className="mt-3 text-center">
                          <button
                            type="button"
                            onClick={resetPayPalButtons}
                            className="text-xs text-gray-500 hover:text-brand underline"
                          >
                            Reset Payment Buttons
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-medium text-green-800">Payment Completed</span>
                        </div>
                        {paymentDetails && (
                          <p className="text-sm text-green-700 mt-1">
                            Order ID: {paymentDetails.orderID}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-8">
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg" 
                    disabled={isSubmitting || items.length === 0 || (needsPayment && !paymentCompleted)}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Package className="h-5 w-5 mr-2" />
                    )}
                    {isSubmitting ? 'Processing...' : 
                     needsPayment && !paymentCompleted ? 'Complete Payment First' : 
                     'Complete Request'}
                  </Button>
                  {needsPayment && !paymentCompleted && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Please complete payment above to enable request submission
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 