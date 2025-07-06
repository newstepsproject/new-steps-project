'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { AdminTable, OrderStatusBadge } from '@/components/admin/common';
import { MobileCardView } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { OrderCard } from '@/components/admin/OrderCard';
import { Order, OrderStatus, ORDER_STATUSES } from '@/types/common';
import { TableColumn, FilterParams, Status } from '@/types/table';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';

export default function OrdersPage() {
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: undefined,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });

  // Pagination setup for orders
  // Pagination logic
  const pagination = usePagination({
    totalItems: orders.length,
    defaultItemsPerPage: 20,
  });

  // Get current page data
  const paginatedOrders = pagination.getPageData(orders);

  // Table columns configuration
  const columns: TableColumn<Order>[] = [
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true
    },
    {
      key: 'userId',
      label: 'Customer',
      sortable: true,
      render: (_, order) => (
        <div>
          <div className="font-medium">{order.userId}</div>
          <div className="text-sm text-gray-500">
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (items) => (
        <div className="space-y-1">
          {items.map((item: any, index: number) => (
            <div key={index} className="text-sm">
              {item.quantity}x {item.shoeName}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'totalCost',
      label: 'Total',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <OrderStatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, order) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleUpdateStatus(order.orderId, getNextStatus(order))}
        >
          Update Status
        </Button>
      )
    }
  ];

  // Get next valid status based on current status
  const getNextStatus = (order: Order): OrderStatus => {
    const currentStatus = order.status;
    switch (currentStatus) {
      case 'pending':
        return 'shipped';  // Pending orders can be shipped
      case 'rejected':
        return 'rejected'; // Rejected orders stay rejected
      case 'shipped':
        return 'cancelled'; // Shipped orders can be cancelled (returns, issues)
      case 'cancelled':
        return 'cancelled'; // Cancelled orders stay cancelled
      default:
        return currentStatus;
    }
  };

  // Handle status update
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });

      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    pagination.resetToFirstPage(); // Reset pagination when filters change
  };

  // Handle sort changes
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Add sorting
      if (filters.sortField) {
        const sortParam = filters.sortDirection === 'desc' ? `-${filters.sortField}` : filters.sortField;
        params.append('sort', sortParam);
      }
      
      // Fetch data from API
      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Error fetching orders: ${response.statusText}`);
      }
      
      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchOrders();
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [filters, sessionStatus, router]);

  if (sessionStatus === 'loading') {
    return <div className="flex justify-center items-center h-64">Checking authentication...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all shoe orders.
          </p>
        </div>
        <Link href="/admin/orders/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            A list of all orders with their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="md:hidden">
            <MobileFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <MobileCardView
              data={paginatedOrders}
              renderCard={(order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  getNextStatus={getNextStatus}
                />
              )}
            />
            
            {/* Mobile Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.setCurrentPage}
                  itemsPerPage={pagination.itemsPerPage}
                  onItemsPerPageChange={pagination.setItemsPerPage}
                  totalItems={orders.length}
                  itemsPerPageOptions={[10, 20, 50, 100]}
                  className="justify-center"
                />
              </div>
            )}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <AdminTable
              data={paginatedOrders}
              columns={columns}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSort={handleSort}
            />
            
            {/* Desktop Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.setCurrentPage}
                  itemsPerPage={pagination.itemsPerPage}
                  onItemsPerPageChange={pagination.setItemsPerPage}
                  totalItems={orders.length}
                  itemsPerPageOptions={[10, 20, 50, 100]}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 