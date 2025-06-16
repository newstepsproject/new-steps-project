'use client';

import React from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, clearCart, itemCount, maxItems } = useCart();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b md:hidden">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Your Cart</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
          <p className="text-gray-600">
            {itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? 'shoe' : 'shoes'} in your request`
              : 'Your cart is empty'}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 96px, 128px"
                      />
                      {/* Prominent Shoe ID Badge */}
                      <div className="absolute top-1 left-1 bg-brand text-white px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                        {item.shoeId}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-base sm:text-lg truncate">
                          {item.name}
                        </h3>
                        <div className="ml-2 text-right">
                          <div className="text-sm font-mono font-medium text-brand">
                            ID: {item.shoeId}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.gender}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Size {item.size}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.condition}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <Card className="p-6 bg-gray-50">
              <h2 className="font-semibold text-lg mb-4">Request Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items to Request</span>
                  <span className="font-medium">{itemCount}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-gray-500">
                    Shipping costs will be calculated at checkout based on your location.
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    💚 By requesting only what you need, you help ensure others can also find their perfect shoes.
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3 pb-20 md:pb-0">
              <Button asChild className="w-full h-12 text-base" size="lg">
                <Link href="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full h-12 text-base"
                size="lg"
              >
                Clear Cart
              </Button>
              <Button
                variant="ghost"
                asChild
                className="w-full h-12 text-base"
                size="lg"
              >
                <Link href="/shoes">
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t added any shoes to your request yet.
            </p>
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/shoes">
                Browse Available Shoes
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
