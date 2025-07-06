import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, BarChart3, Settings, DollarSign, ExternalLink, ArrowRight, Plus, UserCircle, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated or not admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your platform and recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shoe Donations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shoe Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/shoes/add">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-brand/10 rounded-lg">
                    <Plus className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add New Shoe</h3>
                    <p className="text-sm text-gray-500">Add shoes to inventory</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manage Users</h3>
                    <p className="text-sm text-gray-500">View and manage users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/requests">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Requests</h3>
                    <p className="text-sm text-gray-500">Manage shoe requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/shoe-donations">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-5 w-5" />
                  Manage Shoe Donations
                </Button>
              </Link>
              <Link href="/admin/money-donations">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Manage Money Donations
                </Button>
              </Link>
              <Link href="/admin/requests">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-5 w-5" />
                  Manage Shoe Requests
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm font-medium">All systems operational</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 