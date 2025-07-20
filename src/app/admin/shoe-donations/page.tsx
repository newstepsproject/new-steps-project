'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import DonationDetailsDialog from '@/components/admin/DonationDetailsDialog';
import { AdminTable, StatusBadge } from '@/components/admin/common';
import { FilterParams, TableColumn } from '@/types/table';
import Link from 'next/link';
import { MobileCardView } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { DonationCard } from '@/components/admin/DonationCard';
import { Status } from '@/types/common';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

// Define the donation type
interface ShoeDonation {
  _id: string;
  donor: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    brand: string;
    size: string;
    condition: string;
    quantity: number;
  }[];
  status: Status;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  referenceNumber?: string;
}

export default function ShoeDonationsPage() {
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [donations, setDonations] = useState<ShoeDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: undefined,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [selectedDonation, setSelectedDonation] = useState<ShoeDonation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination logic
  const pagination = usePagination({
    totalItems: donations.length,
    defaultItemsPerPage: 15,
  });

  // Get current page data
  const paginatedDonations = pagination.getPageData(donations);

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters.search, filters.status, filters.sortField, filters.sortDirection]);

  // Table columns configuration
  const columns: TableColumn<ShoeDonation>[] = [
    {
      key: 'referenceNumber',
      label: 'Reference #',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'donor',
      label: 'Donor',
      sortable: true,
      render: (value) => value?.name || 'Unknown Donor'
    },
    {
      key: 'items',
      label: 'Items',
      render: (items) => (
        <div className="space-y-1">
          {items.map((item: any, index: number) => (
            <div key={index} className="text-sm">
              {item.quantity}x {item.brand} ({item.size})
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions' as keyof ShoeDonation,
      label: 'Actions',
      render: (_, donation) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedDonation(donation);
            setDetailsOpen(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  // Fetch donations from API
  const fetchDonations = async () => {
    // Don't fetch if not authenticated
    if (sessionStatus !== 'authenticated') {
      return;
    }

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
      
      // Add cache-busting timestamp
      params.append('_t', Date.now().toString());
      
      // Fetch data from API with cache-busting headers
      const response = await fetch(`/api/admin/shoe-donations?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/login');
          return;
        }
        throw new Error(`Error fetching donations: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDonations(data.donations);
      
      console.log(`Fetched ${data.donations.length} donations at ${new Date().toISOString()}`);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load donations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchDonations();
    }
  }, [filters, sessionStatus]);

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

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shoe Donations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track shoe donations from donors.
          </p>
        </div>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={{
          statuses: ['submitted', 'received', 'processed', 'cancelled'],
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
          <CardDescription>
            View and manage all shoe donations.
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
                data={paginatedDonations}
                renderCard={(donation) => <DonationCard donation={donation} />}
                onAction={(action, donation) => {
                  if (action === 'view') {
                    setSelectedDonation(donation);
                    setDetailsOpen(true);
                  }
                }}
                actions={[
                  { label: 'View Details', action: 'view' }
                ]}
              />
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <AdminTable
              data={paginatedDonations}
              columns={columns}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSort={handleSort}
              statusOptions={['submitted', 'received', 'processed', 'cancelled']}
            />
          </div>

          {/* Pagination */}
          {!loading && !error && donations.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={donations.length}
                itemsPerPage={pagination.itemsPerPage}
                itemsPerPageOptions={[10, 15, 25, 50]}
                onPageChange={pagination.setCurrentPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDonation && (
        <DonationDetailsDialog
          donation={selectedDonation}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onStatusChange={fetchDonations}
        />
      )}
    </div>
  );
} 