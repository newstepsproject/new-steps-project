'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footprints, ChevronLeft, Star, Check, Info, ShoppingCart, Image as ImageIcon, Ruler, Hash } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/components/cart/CartProvider';
import { Badge } from '@/components/ui/badge';

export default function ShoeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [shoe, setShoe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedShoes, setRelatedShoes] = useState([]);
  
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, isInCart, canAddMore, itemCount, maxItems } = useCart();
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  
  // Fetch shoe data
  useEffect(() => {
    const fetchShoe = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/shoes/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch shoe');
        }
        
        const data = await response.json();
        setShoe(data.shoe);
        
        // Fetch related shoes
        if (data.shoe?.sport) {
          const relatedResponse = await fetch(`/api/shoes?sport=${encodeURIComponent(data.shoe.sport)}&limit=5`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedShoes(relatedData.shoes.filter(s => s._id !== id).slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error fetching shoe:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShoe();
  }, [id]);
  
  // Handle adding the shoe to the cart
  const handleAddToCart = () => {
    if (!shoe) return;
    
    const success = addItem({
      id: shoe._id,
      shoeId: shoe.shoeId,
      inventoryId: shoe._id,
      name: shoe.modelName,
      brand: shoe.brand,
      modelName: shoe.modelName,
      size: shoe.size,
      color: shoe.color,
      sport: shoe.sport,
      condition: shoe.condition,
      gender: shoe.gender ?? 'unisex',
      image: shoe.images[0] || '/images/placeholder-shoe.jpg',
      quantity: 1,
      price: 0, // Shoes are free
      notes: ''
    });
    
    if (!success) {
      setShowLimitMessage(true);
      setTimeout(() => setShowLimitMessage(false), 5000); // Hide message after 5 seconds
    }
  };

  // Map condition values for display
  const getConditionDisplay = (condition) => {
    if (!condition) return 'Good'; // Default fallback for undefined/null condition
    
    switch(condition) {
      case 'like_new': return 'Like New';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      default: return condition || 'Good'; // Ensure we never return undefined
    }
  };

  // Map gender values for display
  const getGenderDisplay = (gender) => {
    if (!gender) return 'Unisex'; // Default fallback for undefined/null gender
    
    switch(gender) {
      case 'men': return 'Men';
      case 'women': return 'Women';
      case 'boys': return 'Boys';
      case 'girls': return 'Girls';
      case 'unisex': return 'Unisex';
      default: return gender || 'Unisex'; // Ensure we never return undefined
    }
  };

  if (loading) {
    return (
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !shoe) {
    return (
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error loading shoe: {error || 'Shoe not found'}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            href="/shoes" 
            className="text-gray-500 hover:text-brand flex items-center text-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to all shoes
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="sticky top-20 lg:top-24">
            <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm mb-4">
              <div className="relative aspect-square overflow-hidden rounded-md">
                <Image
                  src={shoe.images?.[activeImage] || '/images/placeholder-shoe.jpg'}
                  alt={shoe.modelName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {/* Shoe ID Badge */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-md flex items-center gap-1 sm:gap-2 shadow-sm">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-mono font-bold">{shoe.shoeId}</span>
                </div>
              </div>
            </div>
            
            {/* Thumbnails */}
            {shoe.images && shoe.images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {shoe.images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                      activeImage === idx ? 'border-brand' : 'border-transparent'
                    }`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <Image
                      src={img}
                      alt={`${shoe.modelName} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div>
            <div className="flex flex-col h-full">
              <div className="mb-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-brand text-white text-sm font-medium py-1 px-2 rounded">
                    {shoe.sport || 'General'}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (shoe.averageRating || 0)
                            ? 'text-energy fill-energy'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Prominent Shoe ID Display */}
                <div className="bg-brand-50 border-l-4 border-brand p-3 mb-4 rounded-r-md">
                  <div className="flex items-center">
                    <Hash className="h-5 w-5 text-brand mr-2" />
                    <span className="text-sm font-medium text-brand">Shoe ID:</span>
                    <span className="ml-2 text-lg font-mono font-bold text-brand">{shoe.shoeId}</span>
                  </div>
                  <p className="text-xs text-brand/70 mt-1">Reference this ID when requesting or for customer service</p>
                </div>
                
                <h1 className="text-3xl font-bold mb-1">{shoe.modelName || 'Unknown Model'}</h1>
                <div className="text-xl text-gray-600 mb-4">{shoe.brand || 'Unknown Brand'}</div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-600 text-sm mb-1">Gender</div>
                    <div className="font-semibold">{getGenderDisplay(shoe.gender)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-600 text-sm mb-1">Size</div>
                    <div className="font-semibold">{shoe.size || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-600 text-sm mb-1">Color</div>
                    <div className="font-semibold">{shoe.color || 'Not specified'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-600 text-sm mb-1">Condition</div>
                    <div className="font-semibold">{getConditionDisplay(shoe.condition)}</div>
                  </div>
                </div>
                
                {shoe.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p className="text-gray-700">{shoe.description}</p>
                  </div>
                )}
                
                {shoe.features && shoe.features.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Features</h2>
                    <ul className="space-y-2">
                      {shoe.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-5 w-5 text-brand mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Donor information if available */}
                {(shoe.donorName || shoe.donorEmail) && (
                  <div className="text-sm text-gray-500 mb-6">
                    <div className="flex items-center mb-1">
                      <span className="font-medium mr-2">Donated by:</span>
                      <span>{shoe.donorName || 'Anonymous'}</span>
                    </div>
                    {shoe.createdAt && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Added to inventory:</span>
                        <span>{new Date(shoe.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-start">
                  <Info className="h-5 w-5 text-brand mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Shoes are available at no cost. You may need to pay for shipping 
                    if you're outside the Bay Area. Please create an account or sign in
                    to request this item.
                  </p>
                </div>
                
                {/* Cart status information */}
                {itemCount > 0 && (
                  <div className="mb-4 text-sm text-green-700 text-center">
                    ✓ You have {itemCount} {itemCount === 1 ? 'shoe' : 'shoes'} in your request
                  </div>
                )}
                
                {/* Limit reached message */}
                {showLimitMessage && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      You currently have items in your cart. Please complete your current request or remove items to add this one.
                    </p>
                  </div>
                )}
                
                <Button 
                  className="w-full h-14 sm:h-16 text-base sm:text-lg shadow-sm touch-manipulation" 
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isInCart(shoe._id) || (!isInCart(shoe._id) && !canAddMore)}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isInCart(shoe._id) 
                    ? 'Added to Cart' 
                    : !canAddMore 
                      ? 'Cart Limit Reached' 
                      : 'Request These Shoes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Tabs Section */}
        <div className="mt-16">
          <div className="w-full max-w-none overflow-hidden">
            <Tabs defaultValue="sizing" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex sticky top-0 z-10 bg-white border shadow-sm">
                <TabsTrigger value="sizing">Sizing Information</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sizing" className="p-6 bg-white rounded-lg shadow-sm mt-4 min-h-[300px] w-full max-w-none">
                <div className="flex items-start gap-4">
                  <Ruler className="h-8 w-8 text-brand flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Sizing Guide</h3>
                    <p className="text-gray-700 mb-4">
                      This {shoe.modelName || 'shoe'} is a US {shoe.size || 'unknown'} {getGenderDisplay(shoe.gender)?.toLowerCase() || 'unisex'}'s size. 
                      {shoe.gender === 'men' ? 
                        " Men's shoes typically run about 1.5 sizes larger than women's shoes." : 
                        shoe.gender === 'women' ?
                        " Women's shoes typically run about 1.5 sizes smaller than men's shoes." :
                        ""}
                    </p>
                    
                    <h4 className="font-medium mb-2">How to Measure Your Foot:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Place your foot on a piece of paper against a wall.</li>
                      <li>Mark the longest part of your foot.</li>
                      <li>Measure the distance from the wall to the mark.</li>
                      <li>Use this measurement to find your size in the chart below.</li>
                    </ol>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="shipping" className="p-6 bg-white rounded-lg shadow-sm mt-4 min-h-[300px] w-full max-w-none">
                <div className="flex items-start gap-4">
                  <ImageIcon className="h-8 w-8 text-brand flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Shipping Information</h3>
                    <p className="text-gray-700 mb-4">
                      We ship throughout the United States. There is a flat shipping fee per order. 
                      If you're in the San Francisco Bay Area, you may qualify for free pickup from
                      our San Ramon location.
                    </p>
                    
                    <h4 className="font-medium mb-2">Shipping Timeline:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>Order processing: 1-2 business days</li>
                      <li>Standard shipping: 3-5 business days</li>
                      <li>Bay Area pickup: Available within 24 hours of confirmation</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Related Shoes Section */}
        {relatedShoes.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedShoes.map((relatedShoe) => (
                <div key={relatedShoe._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <Link href={`/shoes/${relatedShoe._id}`} className="block">
                    <div className="relative aspect-square">
                      <Image
                        src={relatedShoe.images?.[0] || '/images/placeholder-shoe.jpg'}
                        alt={relatedShoe.modelName || 'Shoe'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      />
                      {/* Show shoe ID on related items too */}
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {relatedShoe.shoeId}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg truncate">{relatedShoe.modelName || 'Unknown Model'}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">{relatedShoe.brand || 'Unknown Brand'}</span>
                        <span className="text-sm font-medium">Size {relatedShoe.size || 'N/A'}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 