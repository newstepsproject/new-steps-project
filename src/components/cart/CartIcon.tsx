'use client';

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from './CartProvider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function CartIcon() {
  const { items, removeItem, clearCart, itemCount, maxItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-energy text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {itemCount > 0
              ? '💚 By requesting only what you need, you help ensure others can also find their perfect shoes'
              : 'Your cart is empty'}
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        <div className="mt-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex border-b pb-4">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    {/* Shoe ID Badge */}
                    <div className="absolute top-1 left-1 bg-brand text-white px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                      {item.shoeId}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
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
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                You haven&apos;t added any shoes to your cart yet
              </p>
              <Button asChild className="mt-4">
                <Link href="/shoes" onClick={() => setIsOpen(false)}>
                  Browse Shoes
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Cart Actions */}
        {items.length > 0 && (
          <div className="mt-6 space-y-3">
            <Button asChild className="w-full">
              <Link href="/checkout" onClick={() => setIsOpen(false)}>
                Proceed to Checkout
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={clearCart}
              className="w-full"
            >
              Clear Cart
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 