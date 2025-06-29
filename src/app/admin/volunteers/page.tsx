'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileCardView } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { VolunteerCard } from '@/components/admin/VolunteerCard';
import { FilterParams } from '@/types/table';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  location: string;
  interests: string[];
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Placeholder data for UI development
const placeholderVolunteers: Volunteer[] = [
  {
    id: 'VOL-12345678',
    name: 'John Smith',
    email: 'john.smith@example.com',
    location: 'San Francisco, CA',
    interests: ['Collection', 'Outreach'],
    date: '2025-05-12',
    status: 'pending'
  },
  {
    id: 'VOL-87654321',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    location: 'Oakland, CA',
    interests: ['Sorting', 'Tech'],
    date: '2025-05-10',
    status: 'approved'
  }
];

export default function AdminVolunteersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [volunteers, setVolunteers] = useState<Volunteer[]>(placeholderVolunteers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: undefined,
    sortField: 'date',
    sortDirection: 'desc'
  });

  const statusOptions = ['pending', 'approved', 'rejected'];

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    resetToFirstPage(); // Reset pagination when filters change
  };

  // Handle volunteer actions
  const handleView = (id: string) => {
    toast({
      title: "View Details",
      description: `Viewing details for volunteer ${id}`,
    });
  };

  const handleApprove = (id: string) => {
    setVolunteers(prev => 
      prev.map(v => v.id === id ? { ...v, status: 'approved' } : v)
    );
    toast({
      title: "Volunteer Approved",
      description: `Volunteer ${id} has been approved.`,
    });
  };

  const handleReject = (id: string) => {
    setVolunteers(prev => 
      prev.map(v => v.id === id ? { ...v, status: 'rejected' } : v)
    );
    toast({
      title: "Volunteer Rejected",
      description: `Volunteer ${id} has been rejected.`,
    });
  };

  const handleContact = (id: string) => {
    toast({
      title: "Contact Volunteer",
      description: `Opening contact form for volunteer ${id}`,
    });
  };

  const handleArchive = (id: string) => {
    setVolunteers(prev => prev.filter(v => v.id !== id));
    toast({
      title: "Volunteer Archived",
      description: `Volunteer ${id} has been archived.`,
    });
  };

  // Filter volunteers based on search and status
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = !filters.search || 
      volunteer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      volunteer.id.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || volunteer.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination setup
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    resetToFirstPage,
    paginatedData: paginatedVolunteers,
    totalPages,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: filteredVolunteers,
    initialItemsPerPage: 15,
    itemsPerPageOptions: [10, 15, 25, 50]
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  if (sessionStatus === 'loading') {
    return <div className="flex justify-center items-center h-64">Checking authentication...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Volunteer Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Volunteer Applications</CardTitle>
          <CardDescription>
            Volunteer applications are currently being collected through the Get Involved page.
            The backend integration for this admin dashboard is in development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="md:hidden">
            <MobileFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              statusOptions={statusOptions}
              statusLabel="Status"
            />
            <MobileCardView
              data={paginatedVolunteers}
              loading={loading}
              error={error}
              renderCard={(volunteer) => (
                <VolunteerCard
                  key={volunteer.id}
                  volunteer={volunteer}
                  onView={handleView}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onContact={handleContact}
                  onArchive={handleArchive}
                />
              )}
            />
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  itemsPerPageOptions={[10, 15, 25, 50]}
                  className="justify-center"
                />
              </div>
            )}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <div className="table-container">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Interests</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedVolunteers.map((volunteer) => (
                    <tr key={volunteer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{volunteer.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{volunteer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{volunteer.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{volunteer.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {volunteer.interests.map((interest, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                            {interest}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{volunteer.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={
                          volunteer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          volunteer.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm flex justify-center space-x-2">
                        <button 
                          onClick={() => handleView(volunteer.id)}
                          className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded"
                        >
                          View
                        </button>
                        {volunteer.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(volunteer.id)}
                              className="px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(volunteer.id)}
                              className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {volunteer.status === 'approved' && (
                          <button 
                            onClick={() => handleContact(volunteer.id)}
                            className="px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 rounded"
                          >
                            Contact
                          </button>
                        )}
                        <button 
                          onClick={() => handleArchive(volunteer.id)}
                          className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 rounded"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Desktop Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  itemsPerPageOptions={[10, 15, 25, 50]}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Development</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Volunteer Management API</p>
                <p className="text-sm text-gray-500">
                  Integration with the database to fetch and display real volunteer applications
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Badge className="bg-yellow-100 text-yellow-800">
                  In Progress
                </Badge>
              </div>
            </div>
            <div className="flex items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Application Review Workflow</p>
                <p className="text-sm text-gray-500">
                  Functionality to approve, reject, and manage volunteer applications
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Badge className="bg-blue-100 text-blue-800">
                  Planned
                </Badge>
              </div>
            </div>
            <div className="flex items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Email Notification System</p>
                <p className="text-sm text-gray-500">
                  Automated emails for application status updates and volunteer coordination
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Badge className="bg-blue-100 text-blue-800">
                  Planned
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 