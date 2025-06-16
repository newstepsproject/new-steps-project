'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Hash } from 'lucide-react';
import { AdminTable, RequestStatusBadge } from '@/components/admin/common';
import { ShoeRequest, RequestStatus, REQUEST_STATUSES } from '@/types/common';
import { FilterParams, TableColumn } from '@/types/table';
import Link from 'next/link';
import RequestDetailsDialog from '@/components/admin/RequestDetailsDialog';
import { MobileCardView, RequestCard } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

export default function RequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ShoeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: undefined,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [selectedRequest, setSelectedRequest] = useState<ShoeRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination logic
  const pagination = usePagination({
    totalItems: requests.length,
    defaultItemsPerPage: 10,
  });

  // Get current page data
  const paginatedRequests = pagination.getPageData(requests);

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters.search, filters.status, filters.sortField, filters.sortDirection]);

  // Table columns configuration
  const columns: TableColumn<ShoeRequest>[] = [
    {
      key: 'requestorInfo',
      label: 'Requester',
      sortable: true,
      render: (_, request) => {
        if (!request.requestorInfo) {
          return <div className="text-gray-500">No requester info</div>;
        }
        return (
          <div>
            <div className="font-medium">
              {request.requestorInfo.firstName || ''} {request.requestorInfo.lastName || ''}
            </div>
            <div className="text-sm text-gray-500">{request.requestorInfo.email || 'No email'}</div>
            <div className="text-sm text-gray-500">{request.requestorInfo.phone || 'No phone'}</div>
            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              Ref: {request.requestId || 'No ID'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'items',
      label: 'Shoe Details',
      render: (_, request) => {
        if (!request.items || request.items.length === 0) {
          return <div className="text-gray-500 text-sm">No items</div>;
        }
        return (
          <div className="text-sm">
            {request.items.map((item, idx) => (
              <div key={idx} className="mb-2 p-2 bg-gray-50 rounded border-l-2 border-brand">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3 text-brand" />
                    <span className="font-mono font-bold text-brand text-xs">
                      {item.shoeId || 'NO-ID'}
                    </span>
                  </div>
                  {!item.shoeId && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      Missing ID
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div><span className="font-medium">Type:</span> {item.name || 'Unknown'}</div>
                  <div><span className="font-medium">Size:</span> {item.size || 'Unknown'} ({item.gender || 'Unknown'})</div>
                  <div><span className="font-medium">Brand:</span> {item.brand || 'Unknown'}</div>
                  {item.sport && <div><span className="font-medium">Sport:</span> {item.sport}</div>}
                </div>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value) => {
        if (!value) return 'No date';
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return 'Invalid date';
        }
      }
    },
    {
      key: 'statusHistory',
      label: 'Status',
      sortable: true,
      render: (_, request) => {
        const currentStatus = request.statusHistory[0]?.status || 'submitted';
        return <RequestStatusBadge status={currentStatus} />;
      }
    },
    {
      key: 'actions' as keyof ShoeRequest,
      label: 'Actions',
      render: (_, request) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRequest(request);
            setDetailsOpen(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  // Fetch requests from API
  const fetchRequests = async () => {
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
      const response = await fetch(`/api/admin/requests?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching requests: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequests(data.requests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: direction
    }));
  };

  const handleUpdateStatus = async (requestId: string, newStatus: RequestStatus, note: string) => {
    try {
      const response = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          status: newStatus,
          note: note || `Status updated to ${newStatus} by admin`
        }),
      });

      if (!response.ok) {
        throw new Error(`Error updating status: ${response.statusText}`);
      }

      // Refresh requests
      await fetchRequests();

      // Show success toast
      toast({
        title: "Status updated",
        description: `Request status changed to ${newStatus}.`,
      });
    } catch (err) {
      console.error('Error updating request status:', err);
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle card actions
  const handleCardAction = (action: string, request: ShoeRequest) => {
    if (action === 'view') {
      setSelectedRequest(request);
      setDetailsOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shoe Request Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all shoe requests from the community.
          </p>
        </div>
        <Link href="/admin/requests/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Request
          </Button>
        </Link>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={{
          statuses: Object.values(REQUEST_STATUSES),
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Shoe Requests</CardTitle>
          <CardDescription>
            A list of all shoe requests with their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : (
              <MobileCardView
                data={paginatedRequests}
                renderCard={(request) => <RequestCard request={request} />}
                onAction={handleCardAction}
                actions={[
                  { label: 'View Details', action: 'view' }
                ]}
              />
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <AdminTable
              data={paginatedRequests}
              columns={columns}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSort={handleSort}
              statusOptions={Object.values(REQUEST_STATUSES) as any}
            />
          </div>

          {/* Pagination */}
          {!loading && !error && requests.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={requests.length}
                itemsPerPage={pagination.itemsPerPage}
                itemsPerPageOptions={[5, 10, 20, 50]}
                onPageChange={pagination.setCurrentPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <RequestDetailsDialog
          request={selectedRequest}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onStatusChange={handleUpdateStatus}
        />
      )}
    </div>
  );
} 