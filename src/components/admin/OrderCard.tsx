'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Package, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Order, OrderStatus } from '@/types/common';
import { OrderStatusBadge } from './common';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  getNextStatus: (order: Order) => OrderStatus;
}

export function OrderCard({ order, onUpdateStatus, getNextStatus }: OrderCardProps) {
  const nextStatus = getNextStatus(order);
  const canUpdateStatus = nextStatus !== order.status;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">Order #{order.orderId}</h3>
            <p className="text-sm text-gray-500">Customer: {order.userId}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdateStatus && (
                <DropdownMenuItem onClick={() => onUpdateStatus(order.orderId, nextStatus)}>
                  Update to {nextStatus}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Items */}
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Items:</p>
              {order.items.map((item, index) => (
                <p key={index} className="text-sm text-gray-600">
                  {item.quantity}x {item.shoeName}
                </p>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
            </div>
          </div>

          {/* Total and Date */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-semibold">${order.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 