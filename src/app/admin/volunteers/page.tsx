"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileCardView } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { VolunteerCard } from '@/components/admin/VolunteerCard';
import { FilterParams } from '@/types/table';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type VolunteerStatus = 'pending' | 'approved' | 'contacted' | 'rejected' | 'inactive';

interface VolunteerRecord {
  _id?: string;
  volunteerId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  location: string;
  availability?: string;
  interests: string[];
  skills?: string;
  message?: string;
  status: VolunteerStatus;
  submittedAt?: string;
  updatedAt?: string;
  appliedDate: string;
  userId?: string;
}

interface VolunteerDraft {
  volunteerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  availability?: string;
  interestsInput: string;
  skills?: string;
  message?: string;
  status: VolunteerStatus;
  submittedAt?: string;
  updatedAt?: string;
}

const STATUS_OPTIONS: VolunteerStatus[] = ['pending', 'approved', 'contacted', 'rejected', 'inactive'];
const STATUS_LABELS: Record<VolunteerStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  contacted: 'Contacted',
  rejected: 'Rejected',
  inactive: 'Archived',
};

const statusBadgeClasses: Record<VolunteerStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  contacted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-200 text-gray-700',
};

function formatVolunteer(doc: any): VolunteerRecord {
  const rawFirstName = typeof doc.firstName === 'string' ? doc.firstName : '';
  const rawLastName = typeof doc.lastName === 'string' ? doc.lastName : '';
  const fallbackName = typeof doc.name === 'string' ? doc.name : '';

  let firstName = rawFirstName;
  let lastName = rawLastName;

  if (!firstName && !lastName && fallbackName) {
    const parts = fallbackName.split(' ');
    firstName = parts[0] ?? '';
    lastName = parts.slice(1).join(' ');
  }

  const name = [firstName, lastName].filter(Boolean).join(' ') || fallbackName || 'Volunteer';

  const city = typeof doc.city === 'string' ? doc.city : '';
  const state = typeof doc.state === 'string' ? doc.state : '';
  const location = [city, state].filter(Boolean).join(', ');

  const submittedAtDate = doc.submittedAt || doc.createdAt;
  const submittedAt = submittedAtDate ? new Date(submittedAtDate).toISOString() : undefined;
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined;
  const appliedDate = submittedAt ? new Date(submittedAt).toLocaleDateString() : '—';

  const interests = Array.isArray(doc.interests)
    ? doc.interests
        .map((item: unknown) => (typeof item === 'string' ? item : ''))
        .filter((item: string) => item.length > 0)
    : [];

  const status: VolunteerStatus = STATUS_OPTIONS.includes(doc.status) ? doc.status : 'pending';

  return {
    _id: doc._id ? String(doc._id) : String(doc.volunteerId),
    volunteerId: doc.volunteerId,
    firstName,
    lastName,
    name,
    email: doc.email ?? '',
    phone: doc.phone ?? undefined,
    city,
    state,
    location,
    availability: doc.availability ?? '',
    interests,
    skills: doc.skills ?? undefined,
    message: doc.message ?? undefined,
    status,
    submittedAt,
    updatedAt,
    appliedDate,
    userId: doc.userId ? String(doc.userId) : undefined,
  };
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function AdminVolunteersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    status: 'all',
    sortField: 'submittedAt',
    sortDirection: 'desc',
  });
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRecord | null>(null);
  const [volunteerDraft, setVolunteerDraft] = useState<VolunteerDraft | null>(null);
  const [savingVolunteer, setSavingVolunteer] = useState(false);

  const loadVolunteers = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/volunteers', { credentials: 'include' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const formatted = Array.isArray(data.volunteers)
        ? data.volunteers.map(formatVolunteer)
        : [];
      setVolunteers(formatted);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: 'Unable to load volunteers',
        description: 'Please refresh the page or try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, toast]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadVolunteers();
    }
  }, [sessionStatus, loadVolunteers]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  const filteredVolunteers = useMemo(() => {
    const searchTerm = (filters.search ?? '').toLowerCase().trim();

    return volunteers.filter((volunteer) => {
      const matchesSearch =
        !searchTerm ||
        volunteer.name.toLowerCase().includes(searchTerm) ||
        volunteer.email.toLowerCase().includes(searchTerm) ||
        volunteer.volunteerId.toLowerCase().includes(searchTerm) ||
        volunteer.location.toLowerCase().includes(searchTerm) ||
        (volunteer.availability ?? '').toLowerCase().includes(searchTerm);

      const matchesStatus =
        !filters.status ||
        filters.status === 'all' ||
        volunteer.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [volunteers, filters.search, filters.status]);

  const statusCounts = useMemo(() => {
    const counts: Record<VolunteerStatus, number> = {
      pending: 0,
      approved: 0,
      contacted: 0,
      rejected: 0,
      inactive: 0,
    };

    volunteers.forEach((volunteer) => {
      if (counts[volunteer.status] !== undefined) {
        counts[volunteer.status] += 1;
      }
    });

    return counts;
  }, [volunteers]);

  const pagination = usePagination({
    totalItems: filteredVolunteers.length,
    defaultItemsPerPage: 15,
  });

  const {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    resetToFirstPage,
  } = pagination;

  const paginatedVolunteers = pagination.getPageData(filteredVolunteers);
  const totalItems = filteredVolunteers.length;

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    resetToFirstPage();
  };

  const updateVolunteer = useCallback(
    async (volunteerId: string, updates: Record<string, unknown>) => {
      const response = await fetch(`/api/admin/volunteers/${volunteerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update volunteer');
      }

      const formatted = formatVolunteer(data.volunteer);

      setVolunteers((prev) =>
        prev.map((volunteer) =>
          volunteer.volunteerId === volunteerId ? formatted : volunteer
        )
      );

      setSelectedVolunteer((prev) =>
        prev && prev.volunteerId === volunteerId ? formatted : prev
      );

      setVolunteerDraft((prev) =>
        prev && prev.volunteerId === volunteerId
          ? {
              ...prev,
              firstName: formatted.firstName,
              lastName: formatted.lastName,
              email: formatted.email,
              phone: formatted.phone,
              city: formatted.city,
              state: formatted.state,
              availability: formatted.availability,
              interestsInput: formatted.interests.join(', '),
              skills: formatted.skills,
              message: formatted.message,
              status: formatted.status,
              submittedAt: formatted.submittedAt,
              updatedAt: formatted.updatedAt,
            }
          : prev
      );

      return formatted;
    },
    []
  );

  const handleApprove = async (volunteerId: string) => {
    try {
      const updated = await updateVolunteer(volunteerId, { status: 'approved' });
      setLastAction(`Volunteer ${volunteerId} approved`);
      toast({
        title: 'Volunteer approved',
        description: `${updated.name} has been marked as approved.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to approve volunteer.';
      toast({
        title: 'Unable to approve volunteer',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (volunteerId: string) => {
    try {
      const updated = await updateVolunteer(volunteerId, { status: 'rejected' });
      setLastAction(`Volunteer ${volunteerId} rejected`);
      toast({
        title: 'Volunteer rejected',
        description: `${updated.name} has been marked as rejected.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reject volunteer.';
      toast({
        title: 'Unable to reject volunteer',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (volunteerId: string) => {
    try {
      const updated = await updateVolunteer(volunteerId, { status: 'inactive' });
      setLastAction(`Volunteer ${volunteerId} archived`);
      toast({
        title: 'Volunteer archived',
        description: `${updated.name} has been archived.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to archive volunteer.';
      toast({
        title: 'Unable to archive volunteer',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleContact = async (volunteerId: string) => {
    const volunteer = volunteers.find((item) => item.volunteerId === volunteerId);
    if (!volunteer) return;

    try {
      await updateVolunteer(volunteerId, { status: 'contacted' });
      setLastAction(`Volunteer ${volunteerId} marked as contacted`);
      toast({
        title: 'Volunteer contacted',
        description: `${volunteer.name} has been marked as contacted.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update contact status.';
      toast({
        title: 'Unable to update contact status',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    if (volunteer.email) {
      window.open(`mailto:${volunteer.email}`, '_blank');
    }
  };

  const handleView = (volunteerId: string) => {
    const volunteer = volunteers.find((item) => item.volunteerId === volunteerId);
    if (!volunteer) return;

    setSelectedVolunteer(volunteer);
    setVolunteerDraft({
      volunteerId: volunteer.volunteerId,
      firstName: volunteer.firstName,
      lastName: volunteer.lastName,
      email: volunteer.email,
      phone: volunteer.phone,
      city: volunteer.city,
      state: volunteer.state,
      availability: volunteer.availability,
      interestsInput: volunteer.interests.join(', '),
      skills: volunteer.skills,
      message: volunteer.message,
      status: volunteer.status,
      submittedAt: volunteer.submittedAt,
      updatedAt: volunteer.updatedAt,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedVolunteer(null);
    setVolunteerDraft(null);
  };

  const handleSaveVolunteer = async () => {
    if (!volunteerDraft) {
      return;
    }

    if (!volunteerDraft.firstName.trim() || !volunteerDraft.lastName.trim() || !volunteerDraft.email.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'First name, last name, and email are required.',
        variant: 'destructive',
      });
      return;
    }

    const interestsArray = volunteerDraft.interestsInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const payload: Record<string, unknown> = {
      firstName: volunteerDraft.firstName,
      lastName: volunteerDraft.lastName,
      email: volunteerDraft.email,
      phone: volunteerDraft.phone ?? null,
      city: volunteerDraft.city,
      state: volunteerDraft.state,
      availability: volunteerDraft.availability,
      interests: interestsArray,
      skills: volunteerDraft.skills ?? null,
      message: volunteerDraft.message ?? '',
      status: volunteerDraft.status,
    };

    setSavingVolunteer(true);
    try {
      await updateVolunteer(volunteerDraft.volunteerId, payload);
      setLastAction(`Volunteer ${volunteerDraft.volunteerId} updated`);
      toast({
        title: 'Volunteer updated',
        description: 'Changes have been saved successfully.',
      });
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes.';
      toast({
        title: 'Unable to save volunteer',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingVolunteer(false);
    }
  };

  if (sessionStatus === 'loading') {
    return <div className="flex justify-center items-center h-64">Checking authentication...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div role="status" aria-live="polite" data-testid="volunteer-feedback" className="sr-only">
        {lastAction}
      </div>
      <h1 className="text-3xl font-bold mb-6">Volunteer Management</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {STATUS_OPTIONS.map((status) => (
          <Card key={status} className={filters.status === status ? 'border-brand shadow-sm' : undefined}>
            <CardHeader className="pb-2">
              <CardDescription>{STATUS_LABELS[status]}</CardDescription>
              <CardTitle className="text-3xl font-semibold">{statusCounts[status]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Volunteer Applications</CardTitle>
          <CardDescription>
            Review, edit, and manage volunteer applications submitted through the Get Involved page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:hidden">
            <MobileFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              filterOptions={{ statuses: STATUS_OPTIONS }}
              statusLabel="Status"
            />
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading volunteer applications...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-600">{error}</div>
            ) : (
              <>
                <MobileCardView
                  data={paginatedVolunteers}
                  renderCard={(volunteer) => (
                    <VolunteerCard
                      volunteer={volunteer}
                      onView={handleView}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onContact={handleContact}
                      onArchive={handleArchive}
                    />
                  )}
                />

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
              </>
            )}
          </div>

          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading volunteer applications...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-600">{error}</div>
            ) : (
              <>
                <div className="table-container">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Interests</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Availability</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Submitted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedVolunteers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={9}>
                            No volunteer applications match the current filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedVolunteers.map((volunteer) => (
                          <tr key={volunteer.volunteerId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-500">{volunteer.volunteerId}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{volunteer.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{volunteer.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{volunteer.location || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {volunteer.interests.length === 0 ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                volunteer.interests.map((interest, idx) => (
                                  <span
                                    key={`${volunteer.volunteerId}-interest-${idx}`}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
                                  >
                                    {interest}
                                  </span>
                                ))
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{volunteer.availability || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(volunteer.submittedAt)}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge className={statusBadgeClasses[volunteer.status]}>
                                {STATUS_LABELS[volunteer.status]}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm flex justify-center space-x-2">
                              <button
                                onClick={() => handleView(volunteer.volunteerId)}
                                className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded"
                              >
                                View
                              </button>
                              {volunteer.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(volunteer.volunteerId)}
                                    className="px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(volunteer.volunteerId)}
                                    className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {volunteer.status === 'approved' && (
                                <button
                                  onClick={() => handleContact(volunteer.volunteerId)}
                                  className="px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 rounded"
                                >
                                  Contact
                                </button>
                              )}
                              <button
                                onClick={() => handleArchive(volunteer.volunteerId)}
                                className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 rounded"
                              >
                                Archive
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Volunteer Details</DialogTitle>
            <DialogDescription>
              Update volunteer contact information, interests, and application status.
            </DialogDescription>
          </DialogHeader>

          {volunteerDraft && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="volunteer-first-name">First Name</Label>
                  <Input
                    id="volunteer-first-name"
                    value={volunteerDraft.firstName}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, firstName: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="volunteer-last-name">Last Name</Label>
                  <Input
                    id="volunteer-last-name"
                    value={volunteerDraft.lastName}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, lastName: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="volunteer-email">Email</Label>
                  <Input
                    id="volunteer-email"
                    type="email"
                    value={volunteerDraft.email}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, email: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="volunteer-phone">Phone</Label>
                  <Input
                    id="volunteer-phone"
                    value={volunteerDraft.phone ?? ''}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, phone: event.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="volunteer-city">City</Label>
                  <Input
                    id="volunteer-city"
                    value={volunteerDraft.city ?? ''}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, city: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="volunteer-state">State</Label>
                  <Input
                    id="volunteer-state"
                    value={volunteerDraft.state ?? ''}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, state: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="volunteer-availability">Availability</Label>
                  <Input
                    id="volunteer-availability"
                    value={volunteerDraft.availability ?? ''}
                    onChange={(event) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, availability: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="volunteer-status">Status</Label>
                  <Select
                    value={volunteerDraft.status}
                    onValueChange={(value) =>
                      setVolunteerDraft((prev) =>
                        prev ? { ...prev, status: value as VolunteerStatus } : prev
                      )
                    }
                  >
                    <SelectTrigger id="volunteer-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="volunteer-interests">Interests (comma separated)</Label>
                <Input
                  id="volunteer-interests"
                  value={volunteerDraft.interestsInput}
                  onChange={(event) =>
                    setVolunteerDraft((prev) =>
                      prev ? { ...prev, interestsInput: event.target.value } : prev
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="volunteer-skills">Skills</Label>
                <Textarea
                  id="volunteer-skills"
                  value={volunteerDraft.skills ?? ''}
                  onChange={(event) =>
                    setVolunteerDraft((prev) =>
                      prev ? { ...prev, skills: event.target.value } : prev
                    )
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="volunteer-message">Message</Label>
                <Textarea
                  id="volunteer-message"
                  value={volunteerDraft.message ?? ''}
                  onChange={(event) =>
                    setVolunteerDraft((prev) =>
                      prev ? { ...prev, message: event.target.value } : prev
                    )
                  }
                  rows={5}
                />
              </div>

              <div className="flex flex-col md:flex-row md:justify-between md:items-center text-xs text-muted-foreground gap-2">
                <span>Submitted {formatDateTime(volunteerDraft.submittedAt)}</span>
                <span>Last updated {formatDateTime(volunteerDraft.updatedAt)}</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleSaveVolunteer} disabled={savingVolunteer}>
                  {savingVolunteer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
