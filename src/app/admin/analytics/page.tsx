'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import DonationStatistics from '@/components/admin/DonationStatistics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper function to calculate trend indicator
function getTrend(current: number, previous: number) {
  if (current === previous) return { icon: Minus, text: 'No change', color: 'text-gray-500' };
  if (current > previous) {
    const percentIncrease = ((current - previous) / previous) * 100;
    return { 
      icon: TrendingUp, 
      text: `+${percentIncrease.toFixed(1)}%`, 
      color: 'text-green-500' 
    };
  } else {
    const percentDecrease = ((previous - current) / previous) * 100;
    return { 
      icon: TrendingDown, 
      text: `-${percentDecrease.toFixed(1)}%`, 
      color: 'text-red-500' 
    };
  }
}

// Calculate the width percentage for a bar with sensible defaults
function calculateBarWidth(count: number, total: number, options = { minWidth: 10, maxWidth: 100 }) {
  if (total <= 0 || count <= 0) return `${options.minWidth}%`;
  
  // Use a logarithmic scale for better visualization when there's a large difference between values
  const percentage = Math.min(options.maxWidth, Math.max(options.minWidth, 
    (Math.log(count + 1) / Math.log(total + 1)) * 100));
  
  return `${percentage}%`;
}

type AnalyticsData = {
  donations: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    statusBreakdown: Record<string, number>;
    itemsCount: number;
    topBrands: Array<{ name: string; count: number }>;
  };
  moneyDonations: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    totalAmount: number;
    statusBreakdown: Record<string, number>;
  };
  requests: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    statusBreakdown: Record<string, number>;
    topSizes: Array<{ size: string; count: number }>;
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
  const [activeTab, setActiveTab] = useState('overview');

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

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error && activeTab === 'overview') {
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

  // Calculate trends for key metrics
  const donationTrend = stats ? getTrend(stats.donations.thisMonth, stats.donations.lastMonth) : { icon: Minus, text: 'No change', color: 'text-gray-500' };
  const moneyDonationTrend = stats ? getTrend(stats.moneyDonations.thisMonth, stats.moneyDonations.lastMonth) : { icon: Minus, text: 'No change', color: 'text-gray-500' };
  const requestTrend = stats ? getTrend(stats.requests.thisMonth, stats.requests.lastMonth) : { icon: Minus, text: 'No change', color: 'text-gray-500' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Key metrics and insights for the New Steps Project.
        </p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="donations">Donation Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Shoe Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.donations.total || 0}</div>
                <div className="flex items-center space-x-1">
                  <donationTrend.icon className={`h-4 w-4 ${donationTrend.color}`} />
                  <p className={`text-xs ${donationTrend.color}`}>
                    {donationTrend.text} from last month
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.donations.thisMonth || 0} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Money Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats?.moneyDonations.totalAmount.toLocaleString() || 0}</div>
                <div className="flex items-center space-x-1">
                  <moneyDonationTrend.icon className={`h-4 w-4 ${moneyDonationTrend.color}`} />
                  <p className={`text-xs ${moneyDonationTrend.color}`}>
                    {moneyDonationTrend.text} from last month
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.moneyDonations.thisMonth || 0} donations this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Shoe Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.requests.total || 0}</div>
                <div className="flex items-center space-x-1">
                  <requestTrend.icon className={`h-4 w-4 ${requestTrend.color}`} />
                  <p className={`text-xs ${requestTrend.color}`}>
                    {requestTrend.text} from last month
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.requests.thisMonth || 0} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.users.newThisMonth || 0} new this month
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.users.activeThisMonth || 0} active users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          {stats && (
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              {/* Shoe Donation Stats */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Shoe Donation Analytics</CardTitle>
                  <CardDescription>
                    Detailed breakdown of physical shoe donations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">Status Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.donations.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div className="capitalize">{status}</div>
                        <div className="flex items-center">
                          <div className="w-[150px] h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className={`h-full ${status === 'completed' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'} rounded-full`}
                              style={{ width: calculateBarWidth(count as number, stats.donations.total) }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <h3 className="font-semibold mb-2">Top Brands Donated</h3>
                  <div className="space-y-2">
                    {stats.donations.topBrands.map((brand) => (
                      <div key={brand.name} className="flex justify-between items-center">
                        <span>{brand.name}</span>
                        <div className="flex items-center">
                          <div className="w-[150px] h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: calculateBarWidth(brand.count, Math.max(...stats.donations.topBrands.map(b => b.count))) }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{brand.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Money Donation Stats */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Money Donation Analytics</CardTitle>
                  <CardDescription>
                    Detailed breakdown of monetary donations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">Status Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.moneyDonations.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div className="capitalize">{status}</div>
                        <div className="flex items-center">
                          <div className="w-[150px] h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className={`h-full ${status === 'acknowledged' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'} rounded-full`}
                              style={{ width: calculateBarWidth(count as number, stats.moneyDonations.total) }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <h3 className="font-semibold mb-2">Total Amount Received</h3>
                  <div className="text-2xl font-bold text-green-700 mb-2">
                    ${stats.moneyDonations.totalAmount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">
                    From {stats.moneyDonations.total} individual donations
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Average donation: ${stats.moneyDonations.total > 0 
                      ? (stats.moneyDonations.totalAmount / stats.moneyDonations.total).toFixed(2) 
                      : '0.00'}
                  </p>
                </CardContent>
              </Card>

              {/* Request Stats */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Request Analytics</CardTitle>
                  <CardDescription>
                    Detailed breakdown of all shoe requests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">Status Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.requests.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div className="capitalize">{status}</div>
                        <div className="flex items-center">
                          <div className="w-[150px] h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className={`h-full ${status === 'delivered' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'} rounded-full`}
                              style={{ width: calculateBarWidth(count as number, stats.requests.total) }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <h3 className="font-semibold mb-2">Most Requested Types</h3>
                  <div className="space-y-2">
                    {stats.requests.topTypes.map((type) => (
                      <div key={type.type} className="flex justify-between items-center">
                        <span>{type.type}</span>
                        <div className="flex items-center">
                          <div className="w-[150px] h-2 bg-gray-100 rounded-full mr-2">
                            <div 
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: calculateBarWidth(type.count, Math.max(...stats.requests.topTypes.map(t => t.count))) }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{type.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Stats */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                  <CardDescription>
                    Detailed breakdown of user activity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">User Summary</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-xl font-bold">{stats.users.total}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">New This Month</p>
                            <p className="text-xl font-bold">{stats.users.newThisMonth}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Active Users</p>
                            <p className="text-xl font-bold">{stats.users.activeThisMonth}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Activity Rate</p>
                            <p className="text-xl font-bold">
                              {stats.users.total > 0 
                                ? `${Math.round((stats.users.activeThisMonth / stats.users.total) * 100)}%` 
                                : '0%'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="donations">
          <Card>
            <CardContent className="pt-6">
              <DonationStatistics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 