'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type InterestType = 'general' | 'partnership' | 'volunteer' | 'donation';
type InterestStatus = 'new' | 'contacted' | 'in_progress' | 'closed';

interface InterestRecord {
  _id: string;
  interestId: string;
  type: InterestType;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  organizationName?: string;
  organizationType?: string;
  subject?: string;
  message: string;
  source?: string;
  status: InterestStatus;
  notes?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<InterestStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  closed: 'Closed',
};

const TYPE_LABELS: Record<InterestType, string> = {
  general: 'General',
  partnership: 'Partnership',
  volunteer: 'Volunteer',
  donation: 'Donation',
};

const STATUS_OPTIONS: InterestStatus[] = ['new', 'contacted', 'in_progress', 'closed'];

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};
export default function InterestSubmissionsPage() {
  const { toast } = useToast();
  const [interests, setInterests] = useState<InterestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | InterestStatus>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<InterestRecord | null>(null);
  const [interestDraft, setInterestDraft] = useState<InterestRecord | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [savingInterest, setSavingInterest] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const fetchInterests = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (debouncedSearch) {
          params.append('search', debouncedSearch);
        }

        const response = await fetch(`/api/admin/interests?${params.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch interests: ${response.statusText}`);
        }

        const data = await response.json();
        setInterests(data.interests ?? []);
      } catch (err) {
        console.error('Error loading interests:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          title: 'Failed to load partnership submissions',
          description: 'Please try again or refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [statusFilter, debouncedSearch, toast]);

  const handleStatusChange = async (interestId: string, nextStatus: InterestStatus) => {
    setUpdatingStatusId(interestId);
    try {
      const response = await fetch(`/api/admin/interests/${interestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      const { interest } = await response.json();
      setInterests((prev) => prev.map((item) => (item.interestId === interestId ? { ...item, ...interest } : item)));
      if (selectedInterest?.interestId === interestId) {
        setSelectedInterest((prev) => (prev ? { ...prev, ...interest } : prev));
        setInterestDraft((prev) => (prev ? { ...prev, ...interest } : prev));
      }
      toast({
        title: 'Status updated',
        description: `Marked as ${STATUS_LABELS[nextStatus]}.`,
      });
    } catch (err) {
      console.error('Error updating interest status:', err);
      toast({
        title: 'Unable to update status',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openInterestDetails = (interest: InterestRecord) => {
    setSelectedInterest(interest);
    setInterestDraft({ ...interest });
  };

  const handleSaveInterest = async () => {
    if (!interestDraft) return;

    setSavingInterest(true);
    try {
      const payload = {
        status: interestDraft.status,
        firstName: interestDraft.firstName,
        lastName: interestDraft.lastName,
        name:
          [interestDraft.firstName, interestDraft.lastName]
            .filter(Boolean)
            .join(' ') || interestDraft.name,
        email: interestDraft.email,
        phone: interestDraft.phone ?? null,
        organizationName: interestDraft.organizationName,
        organizationType: interestDraft.organizationType,
        subject: interestDraft.subject,
        message: interestDraft.message,
        notes: interestDraft.notes ?? '',
      };

      const response = await fetch(`/api/admin/interests/${interestDraft.interestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update submission');
      }

      const updated = data.interest as InterestRecord;
      setInterests((prev) =>
        prev.map((item) => (item.interestId === updated.interestId ? { ...item, ...updated } : item))
      );
      toast({
        title: 'Submission updated',
        description: 'Changes have been saved successfully.',
      });
      setSelectedInterest(null);
      setInterestDraft(null);
    } catch (err) {
      console.error('Error saving submission:', err);
      toast({
        title: 'Unable to save submission',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavingInterest(false);
    }
  };

  const statusCounts = useMemo(() => {
    return interests.reduce(
      (acc, interest) => {
        acc[interest.status] = (acc[interest.status] || 0) + 1;
        return acc;
      },
      {} as Record<InterestStatus, number>
    );
  }, [interests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Partnership Submissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track partnership inquiries submitted through our Get Involved pathways.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_OPTIONS.map((status) => (
          <Card key={status} className={statusFilter === status ? 'border-brand shadow-sm' : undefined}>
            <CardHeader className="pb-2">
              <CardDescription>{STATUS_LABELS[status]}</CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {statusCounts[status] ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>Review new partnership submissions and track follow-up status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="interest-search">
                Search
              </label>
              <Input
                id="interest-search"
                placeholder="Search by name, email, organization, or subject"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="status-filter">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InterestStatus | 'all')}>
                  <SelectTrigger id="status-filter" className="w-[160px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>
        </div>

          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading submissions...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-red-600">{error}</div>
            ) : interests.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No submissions match the current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interests.map((interest) => (
                    <TableRow key={interest.interestId}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{interest.name}</p>
                          <p className="text-sm text-muted-foreground">{interest.email}</p>
                          {interest.phone && (
                            <p className="text-sm text-muted-foreground">{interest.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {interest.organizationName || '—'}
                          </p>
                          {interest.organizationType && (
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {interest.organizationType}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TYPE_LABELS[interest.type]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={interest.status}
                          onValueChange={(value) => handleStatusChange(interest.interestId, value as InterestStatus)}
                          disabled={updatingStatusId === interest.interestId}
                        >
                          <SelectTrigger className="w-[140px]">
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
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {new Date(interest.submittedAt || interest.createdAt).toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openInterestDetails(interest)}>
                          <MessageCircle className="mr-2 h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedInterest)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInterest(null);
            setInterestDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review and update the partnership inquiry information.
            </DialogDescription>
          </DialogHeader>

          {interestDraft && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="interest-first-name">First Name</Label>
                  <Input
                    id="interest-first-name"
                    value={interestDraft.firstName ?? ''}
                    onChange={(event) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, firstName: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interest-last-name">Last Name</Label>
                  <Input
                    id="interest-last-name"
                    value={interestDraft.lastName ?? ''}
                    onChange={(event) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, lastName: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interest-email">Email</Label>
                  <Input
                    id="interest-email"
                    type="email"
                    value={interestDraft.email}
                    onChange={(event) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, email: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interest-phone">Phone</Label>
                  <Input
                    id="interest-phone"
                    value={interestDraft.phone ?? ''}
                    onChange={(event) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, phone: event.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="interest-organization">Organization</Label>
                  <Input
                    id="interest-organization"
                    value={interestDraft.organizationName ?? ''}
                    onChange={(event) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, organizationName: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interest-organization-type">Organization Type</Label>
                  <Input
                    id="interest-organization-type"
                    value={interestDraft.organizationType ?? ''}
                    onChange={(event) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, organizationType: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="interest-status">Status</Label>
                  <Select
                    value={interestDraft.status}
                    onValueChange={(value) =>
                      setInterestDraft((prev) =>
                        prev ? { ...prev, status: value as InterestStatus } : prev
                      )
                    }
                  >
                    <SelectTrigger id="interest-status">
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
                <div>
                  <Label htmlFor="interest-type">Submission Type</Label>
                  <Input id="interest-type" value={TYPE_LABELS[interestDraft.type]} disabled />
                </div>
              </div>

              <div>
                <Label htmlFor="interest-subject">Subject</Label>
                <Input
                  id="interest-subject"
                  value={interestDraft.subject ?? ''}
                  onChange={(event) =>
                    setInterestDraft((prev) =>
                      prev ? { ...prev, subject: event.target.value } : prev
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="interest-message">Message</Label>
                <Textarea
                  id="interest-message"
                  value={interestDraft.message ?? ''}
                  onChange={(event) =>
                    setInterestDraft((prev) =>
                      prev ? { ...prev, message: event.target.value } : prev
                    )
                  }
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="interest-notes">Internal Notes</Label>
                <Textarea
                  id="interest-notes"
                  value={interestDraft.notes ?? ''}
                  onChange={(event) =>
                    setInterestDraft((prev) =>
                      prev ? { ...prev, notes: event.target.value } : prev
                    )
                  }
                  placeholder="Track follow-up actions or additional context here."
                  rows={4}
                />
              </div>

              <div className="flex flex-col md:flex-row md:justify-between md:items-center text-xs text-muted-foreground gap-2">
                <span>Submitted {formatDateTime(interestDraft.submittedAt)}</span>
                <span>Last updated {formatDateTime(interestDraft.updatedAt)}</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedInterest(null);
                    setInterestDraft(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveInterest} disabled={savingInterest}>
                  {savingInterest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
