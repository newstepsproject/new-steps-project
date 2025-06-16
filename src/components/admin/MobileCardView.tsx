'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Globe, Store, Hash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileCardViewProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  onAction?: (action: string, item: T) => void;
  actions?: Array<{
    label: string;
    action: string;
    destructive?: boolean;
  }>;
}

export function MobileCardView<T extends { _id: string }>({ 
  data, 
  renderCard, 
  onAction,
  actions = []
}: MobileCardViewProps<T>) {
  return (
    <div className="space-y-4 md:hidden">
      {data.map((item) => (
        <Card key={item._id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {renderCard(item)}
              </div>
              {actions.length > 0 && onAction && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action) => (
                      <DropdownMenuItem
                        key={action.action}
                        onClick={() => onAction(action.action, item)}
                        className={action.destructive ? 'text-red-600' : ''}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Shoe Card Component
export function ShoeCard({ shoe, onAction }: { shoe: any; onAction?: (action: string) => void }) {
  if (!shoe) return <div>No shoe data available</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">ID: {shoe.shoeId || 'N/A'}</h3>
          <p className="text-sm text-gray-500">{shoe.brand || 'Unknown'} - {shoe.modelName || 'Unknown'}</p>
        </div>
        <Badge className={getStatusBadgeStyle(shoe.status)}>
          {shoe.status || 'Unknown'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Size:</span> {shoe.size || 'N/A'}
        </div>
        <div>
          <span className="text-gray-500">Gender:</span> {shoe.gender || 'N/A'}
        </div>
        <div>
          <span className="text-gray-500">Sport:</span> {shoe.sport || 'N/A'}
        </div>
        <div>
          <span className="text-gray-500">Color:</span> {shoe.color || 'N/A'}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Inventory:</span>
            <Badge className={getInventoryBadgeStyle(shoe.inventoryCount || 0)}>
              {shoe.inventoryCount || 0}
            </Badge>
          </div>
          {shoe.donationId ? (
            <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap">
              <Globe className="h-3 w-3" />
              <span>Online</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs flex items-center gap-1 whitespace-nowrap">
              <Store className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
        </div>
        
        {/* Donor Information */}
        {shoe.donorName && (
          <div className="text-sm">
            <span className="text-gray-500">Donor:</span> {shoe.donorName}
          </div>
        )}
        
        {/* Reference Number */}
        {shoe.referenceNumber && (
          <div className="text-sm">
            <span className="text-gray-500">Reference:</span> <span className="font-mono">{shoe.referenceNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Request Card Component
export function RequestCard({ request }: { request: any }) {
  const currentStatus = request.statusHistory?.[0]?.status || 'submitted';
  
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">
            {request.requestorInfo?.firstName} {request.requestorInfo?.lastName}
          </h3>
          <p className="text-sm text-gray-500">{request.requestorInfo?.email}</p>
          <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
            Ref: {request.requestId || 'No ID'}
          </div>
        </div>
        <Badge className={getRequestStatusBadgeStyle(currentStatus)}>
          {currentStatus}
        </Badge>
      </div>
      
      {request.items?.map((item: any, idx: number) => (
        <div key={idx} className="bg-gray-50 p-3 rounded border-l-2 border-brand">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-brand" />
              <span className="font-mono font-bold text-brand text-sm">
                {item.shoeId || 'NO-ID'}
              </span>
            </div>
            {!item.shoeId && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                Missing ID
              </Badge>
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium">{item.name || 'Unknown'}</p>
            <p className="text-gray-600">
              Size {item.size || 'Unknown'} ({item.gender || 'Unknown'}) - {item.brand || 'Unknown'}
            </p>
            {item.sport && (
              <p className="text-gray-600">Sport: {item.sport}</p>
            )}
          </div>
        </div>
      ))}
      
      <div className="text-sm text-gray-500 pt-2 border-t">
        {new Date(request.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

// Helper functions for badge styles
function getStatusBadgeStyle(status: string) {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    requested: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-teal-100 text-teal-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
}

function getInventoryBadgeStyle(count: number) {
  if (count === 0) return 'bg-red-100 text-red-800';
  if (count < 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

function getRequestStatusBadgeStyle(status: string) {
  const styles: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
} 