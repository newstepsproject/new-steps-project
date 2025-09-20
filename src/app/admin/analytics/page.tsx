'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type AnalyticsData = {
  donations: {
    total: number;
    thisMonth: number;
    statusBreakdown: Record<string, number>;
    topBrands: Array<{ name: string; count: number }>;
  };
  moneyDonations: {
    total: number;
    thisMonth: number;
    totalAmount: number;
    statusBreakdown: Record<string, number>;
  };
  requests: {
    total: number;
    thisMonth: number;
    statusBreakdown: Record<string, number>;
    topTypes: Array<{ type: string; count: number }>;
  };
  users: {
    total: number;
    newThisMonth: number;
    activeThisMonth: number;
  };
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/analytics');
      
      if (!response.ok) {
        throw new Error(`Error fetching analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load analytics data</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={fetchAnalytics}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Basic metrics for the New Steps Project.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="analytics-card-donations">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shoe Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.donations.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.donations.thisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="analytics-card-money">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Money Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.moneyDonations.totalAmount.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.moneyDonations.thisMonth || 0} donations this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="analytics-card-requests">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shoe Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.requests.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.requests.thisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="analytics-card-users">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users.newThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simple Breakdowns */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Shoe Donation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shoe Donation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.donations.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize text-sm">{status}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Money Donation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Money Donation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.moneyDonations.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize text-sm">{status}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Request Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.requests.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize text-sm">{status}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Brands */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Donated Brands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.donations.topBrands.slice(0, 5).map((brand) => (
                  <div key={brand.name} className="flex justify-between">
                    <span className="text-sm">{brand.name}</span>
                    <span className="text-sm font-medium">{brand.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Request Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Request Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.requests.topTypes.slice(0, 5).map((type) => (
                  <div key={type.type} className="flex justify-between">
                    <span className="text-sm">{type.type}</span>
                    <span className="text-sm font-medium">{type.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Users</span>
                  <span className="text-sm font-medium">{stats.users.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">New This Month</span>
                  <span className="text-sm font-medium">{stats.users.newThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Users</span>
                  <span className="text-sm font-medium">{stats.users.activeThisMonth}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 