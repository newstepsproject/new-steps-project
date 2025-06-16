'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';
import { AdminTable, RoleBadge } from '@/components/admin/common';
import { FilterParams, TableColumn } from '@/types/table';
import { UserRole } from '@/types/user';
import Link from 'next/link';
import { MobileCardView } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { UserCard } from '@/components/admin/UserCard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

// Define the user type
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  emailVerified: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  schoolName?: string;
  grade?: string;
  sports?: string[];
  sportClub?: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: undefined,
    sortField: 'createdAt',
    sortDirection: 'desc'
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination logic
  const pagination = usePagination({
    totalItems: users.length,
    defaultItemsPerPage: 20,
  });

  // Get current page data
  const paginatedUsers = pagination.getPageData(users);

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters.search, filters.status, filters.sortField, filters.sortDirection]);

  // Table columns configuration
  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, user) => `${user.firstName} ${user.lastName}`
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => value
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value || '-'
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => <RoleBadge role={value} />
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'emailVerified',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? "brand" : "destructive"}>
          {value ? "Verified" : "Unverified"}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, user) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedUser(user);
            setDetailsOpen(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  // Fetch users from API
  const fetchUsers = async () => {
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
        params.append('role', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Add sorting
      const sortParam = filters.sortDirection === 'desc' ? `-${filters.sortField}` : filters.sortField;
      params.append('sort', sortParam);
      
      // Fetch data from API
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/login');
          return;
        }
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUsers();
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

  // Handle role change
  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          role
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }
      
      // Refresh the users list
      fetchUsers();
      
      // Show success toast
      toast({
        title: "User updated",
        description: `User role changed to ${role}.`,
      });
      
      // Close the details dialog if open
      setDetailsOpen(false);
    } catch (err) {
      console.error('Error updating user role:', err);
      toast({
        title: "Error",
        description: `Failed to update user role: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Handle update user information
  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          ...userData
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user information');
      }
      
      // Refresh the users list
      fetchUsers();
      
      // Show success toast
      toast({
        title: "User updated",
        description: "User information updated successfully.",
      });
      
      // Close the details dialog
      setDetailsOpen(false);
    } catch (err) {
      console.error('Error updating user:', err);
      toast({
        title: "Error",
        description: `Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage user accounts on the platform.
          </p>
        </div>
        <Link href="/admin/users/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={{
          statuses: Object.values(UserRole),
        }}
        statusLabel="Role"
      />

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and their roles.
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
                data={paginatedUsers}
                renderCard={(user) => <UserCard user={user} />}
                onAction={(action, user) => {
                  if (action === 'view') {
                    setSelectedUser(user);
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
              data={paginatedUsers}
              columns={columns}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSort={handleSort}
              statusOptions={Object.values(UserRole)}
            />
          </div>

          {/* Pagination */}
          {!loading && !error && users.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={users.length}
                itemsPerPage={pagination.itemsPerPage}
                itemsPerPageOptions={[10, 20, 50, 100]}
                onPageChange={pagination.setCurrentPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onRoleChange={handleRoleChange}
          onUserUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
} 