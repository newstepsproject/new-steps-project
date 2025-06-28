'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import MoneyDonationDetailsDialog from '@/components/admin/MoneyDonationDetailsDialog';
import { AdminTable, StatusBadge, MoneyDonationStatusBadge } from '@/components/admin/common';
import { FilterParams } from '@/types/common';
import Link from 'next/link';
import { MobileCardView } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { MoneyDonationCard } from '@/components/admin/MoneyDonationCard';
import { Status, MoneyDonationStatus } from '@/types/common';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

// Define the table column interface (matching AdminTable expectations)
interface TableColumn<T> {
  key?: keyof T | 'actions';
  id?: string;
  label?: string;
  header?: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  cell?: (item: T) => React.ReactNode;
}

// Define the money donation type
interface MoneyDonation {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  amount: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  donationId: string;
  checkNumber?: string;
}

// Display names for money donation statuses
const MONEY_DONATION_STATUS_DISPLAY = {
  submit: 'Submitted',
  received: 'Received',
  processed: 'Processed',
  cancelled: 'Cancelled'
};

export default function MoneyDonationsPage() {
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [donations, setDonations] = useState<MoneyDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: undefined,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [selectedDonation, setSelectedDonation] = useState<MoneyDonation | null>(null);
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
  const columns: TableColumn<MoneyDonation>[] = [
    {
      id: 'donationId',
      header: 'Reference #',
      cell: (row) => row.donationId || 'N/A',
      sortable: true,
    },
    {
      id: 'name',
      header: 'Donor',
      cell: (row) => row.name || 'Anonymous',
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      cell: (row) => row.email || 'N/A',
      sortable: true,
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: (row) => `$${row.amount.toFixed(2)}`,
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <MoneyDonationStatusBadge status={row.status as MoneyDonationStatus} />,
      sortable: true,
    },
    {
      id: 'createdAt',
      header: 'Date',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedDonation(row);
            setDetailsOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
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
      
      // Fetch data from API
      const response = await fetch(`/api/admin/money-donations?${params.toString()}`, {
        credentials: 'include'
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
      
      // Make sure donations have the expected structure for our components
      const processedDonations = data.donations.map((donation: any) => ({
        _id: donation._id,
        name: donation.name,
        email: donation.email,
        phone: donation.phone,
        amount: donation.amount,
        status: donation.status,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
        notes: donation.notes,
        donationId: donation.donationId,
        checkNumber: donation.checkNumber
      }));
      
      setDonations(processedDonations);
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
  }, [sessionStatus, filters.search, filters.status, filters.sortField, filters.sortDirection]);

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
          <h1 className="text-2xl font-semibold text-gray-900">Money Donations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track monetary donations.
          </p>
        </div>
        <Link href="/admin/money-donations/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Donation
          </Button>
        </Link>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={{
          statuses: [
            { value: 'submit', label: 'Submitted' },
            { value: 'received', label: 'Received' },
            { value: 'processed', label: 'Processed' },
            { value: 'cancelled', label: 'Cancelled' }
          ],
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
          <CardDescription>
            View and manage all monetary donations.
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
                renderCard={(donation) => (
                  <MoneyDonationCard 
                    donation={{
                      _id: donation._id,
                      name: donation.name,
                      email: donation.email,
                      phone: donation.phone,
                      amount: donation.amount,
                      status: donation.status,
                      createdAt: donation.createdAt,
                      notes: donation.notes,
                      donationId: donation.donationId,
                      checkNumber: donation.checkNumber
                    }} 
                  />
                )}
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
              statusOptions={[
                { value: 'submit', label: 'Submitted' },
                { value: 'received', label: 'Received' },
                { value: 'processed', label: 'Processed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
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
        <MoneyDonationDetailsDialog
          donation={selectedDonation}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onStatusChange={fetchDonations}
        />
      )}
    </div>
  );
} 