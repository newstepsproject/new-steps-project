'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Status badge mapping
const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  received: 'bg-cyan-100 text-cyan-800',
  processed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

// Status icon mapping
const statusIcons: Record<string, JSX.Element> = {
  submitted: <TrendingUp className="h-4 w-4" />,
  received: <Clock className="h-4 w-4" />,
  processed: <CheckCircle2 className="h-4 w-4" />,
  cancelled: <AlertTriangle className="h-4 w-4" />
};

// Pie chart colors
const COLORS = ['#FFBB28', '#8884d8', '#00C49F', '#82ca9d', '#ff8042'];

export default function DonationStatistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchDonationStats();
  }, [period]);

  const fetchDonationStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/dashboard/donation-stats?period=${period}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching donation statistics: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching donation statistics:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format statistics for pie chart
  const formatStatusForPieChart = () => {
    if (!stats?.byStatus) return [];
    
    return Object.entries(stats.byStatus).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: Number(count),
      color: COLORS[index % COLORS.length]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Donation Statistics</h2>
          <p className="text-sm text-gray-500">
            Overview of donation activity and processing metrics
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading statistics...</span>
        </div>
      ) : error ? (
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="ml-2">
                <h3 className="font-medium text-red-800">Error loading donation statistics</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Summary Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {period === 'all' ? 'All time' : 
                 period === 'year' ? 'Past year' : 
                 period === 'month' ? 'Past month' : 'Past week'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Donations processed successfully
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg. Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.processingTime.average} days</div>
              <p className="text-xs text-gray-500 mt-1">
                From submission to processing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Processed Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.byStatus?.processed || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Ready for inventory
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Donation Status Breakdown</CardTitle>
              <CardDescription>
                Distribution of donations by current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatStatusForPieChart()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatStatusForPieChart().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {Object.keys(stats.byStatus || {}).map(status => (
                  <Badge key={status} className={statusColors[status] || 'bg-gray-100'}>
                    <span className="flex items-center">
                      {statusIcons[status]}
                      <span className="ml-1 capitalize">{status.replace('_', ' ')}: {stats.byStatus[status]}</span>
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Donation Trend</CardTitle>
              <CardDescription>
                Donation volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.monthlyTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Donations"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
} 