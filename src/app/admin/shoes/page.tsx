'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash, RefreshCw, Gift, Package, TruckIcon, Globe, Store } from 'lucide-react';
import { SHOE_BRANDS, SHOE_GENDERS, SHOE_SPORTS, SHOE_STATUSES } from '@/constants/config';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileCardView, ShoeCard } from '@/components/admin/MobileCardView';
import { MobileFilters } from '@/components/admin/MobileFilters';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';


// Define the Shoe type
interface Shoe {
  _id: string;
  shoeId: number;
  sku: string;
  brand: string;
  modelName: string;
  sport: string;
  size: string;
  color: string;
  condition: string;
  gender: string;
  inventoryCount: number;
  status: string;
  donationId?: string;
  donorName?: string;
  donorEmail?: string;
  referenceNumber?: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sport: 'all',
    brand: 'all',
    source: 'all',
  });

  // Filter shoes based on search and filters
  const filteredShoes = shoes.filter(shoe => {
    const matchesSearch = filters.search === '' || 
      shoe.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
      shoe.modelName.toLowerCase().includes(filters.search.toLowerCase()) ||
      shoe.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      (shoe.shoeId && shoe.shoeId.toString().includes(filters.search.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || filters.status === shoe.status;
    const matchesSport = filters.sport === 'all' || filters.sport === shoe.sport;
    const matchesBrand = filters.brand === 'all' || filters.brand === shoe.brand;
    const matchesSource = filters.source === 'all' || 
      (filters.source === 'donation' && shoe.donationId) || 
      (filters.source === 'direct' && !shoe.donationId);
    
    return matchesSearch && matchesStatus && matchesSport && matchesBrand && matchesSource;
  });

  // Pagination logic
  const pagination = usePagination({
    totalItems: filteredShoes.length,
    defaultItemsPerPage: 20,
  });

  // Get current page data
  const paginatedShoes = pagination.getPageData(filteredShoes);

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters.search, filters.status, filters.sport, filters.brand, filters.source]);
  
  // Sort sports and brands alphabetically
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));
  
  // Calculate statistics
  const totalShoes = shoes.length;
  const availableShoes = shoes.filter((shoe: Shoe) => 
    shoe.status === SHOE_STATUSES.AVAILABLE && shoe.inventoryCount > 0
  ).reduce((sum, shoe) => sum + shoe.inventoryCount, 0);
  const shippedShoes = shoes.filter((shoe: Shoe) => 
    shoe.status === SHOE_STATUSES.SHIPPED
  ).length;
  
  // Fetch shoes data
  useEffect(() => {
    const fetchShoes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/shoes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch shoes');
        }
        
        const data = await response.json();
        setShoes(data.shoes || []);
      } catch (error) {
        console.error('Error fetching shoes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShoes();
  }, []);

  // Handle delete shoe
  const handleDelete = async (mongoId: string) => {
    if (!confirm('Are you sure you want to delete this shoe? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shoes/${mongoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete shoe');
      }

      // Remove the shoe from the local state
      setShoes(shoes.filter(shoe => shoe._id !== mongoId));
    } catch (error) {
      console.error('Error deleting shoe:', error);
      alert('Failed to delete shoe. Please try again.');
    }
  };

  // Status badge styles - Simplified for 4-status system
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case SHOE_STATUSES.AVAILABLE:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case SHOE_STATUSES.REQUESTED:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case SHOE_STATUSES.SHIPPED:
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case SHOE_STATUSES.UNAVAILABLE:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Inventory count badge style
  const getInventoryBadgeStyle = (count: number) => {
    if (count === 0) return 'bg-red-100 text-red-800';
    if (count < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Handle actions for mobile cards
  const handleCardAction = (action: string, shoe: any) => {
    if (action === 'edit') {
      router.push(`/admin/shoes/edit/${shoe._id}`);
    } else if (action === 'delete') {
      handleDelete(shoe._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shoe Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your shoe inventory and track donations
          </p>
        </div>
        <Link href="/admin/shoes/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add a Shoe
          </Button>
        </Link>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shoes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShoes}</div>
            <p className="text-xs text-muted-foreground">
              Total unique shoes in inventory
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableShoes}</div>
            <p className="text-xs text-muted-foreground">
              Shoes available for request
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <TruckIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{shippedShoes}</div>
            <p className="text-xs text-muted-foreground">
              Shoes shipped or delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        filters={filters}
        onFilterChange={setFilters}
        filterOptions={{
          statuses: Object.values(SHOE_STATUSES),
          sports: sortedSports,
          brands: sortedBrands,
          sources: [
            { value: 'donation', label: 'From Donations' },
            { value: 'direct', label: 'Direct Entry' }
          ]
        }}
      />

      {/* Desktop Filters */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Inventory Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar - Full Width */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by ID, brand, model or SKU..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(SHOE_STATUSES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.sport} onValueChange={(value) => setFilters({ ...filters, sport: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sortedSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.brand} onValueChange={(value) => setFilters({ ...filters, brand: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {sortedBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="donation">From Donations</SelectItem>
                  <SelectItem value="direct">Direct Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Shoe Inventory</CardTitle>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <MobileCardView
                data={paginatedShoes}
                renderCard={(shoe) => <ShoeCard shoe={shoe} />}
                onAction={handleCardAction}
                actions={[
                  { label: 'Edit', action: 'edit' },
                  { label: 'Delete', action: 'delete', destructive: true }
                ]}
              />

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="table-container rounded-md border">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">ID</TableHead>
                        <TableHead className="w-16">SKU</TableHead>
                        <TableHead className="w-14">Brand</TableHead>
                        <TableHead className="w-16">Model</TableHead>
                        <TableHead className="w-14">Sport</TableHead>
                        <TableHead className="w-10">Size</TableHead>
                        <TableHead className="w-14">Color</TableHead>
                        <TableHead className="w-20">Condition</TableHead>
                        <TableHead className="w-12">Gender</TableHead>
                        <TableHead className="w-10 text-center">Inv</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead className="w-24">Donor</TableHead>
                        <TableHead className="w-24">Reference #</TableHead>
                        <TableHead className="w-20 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedShoes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                            {filteredShoes.length === 0 
                              ? "No shoes found. Try adjusting your filters or add some shoes to inventory."
                              : "No items on this page. Try a different page or adjust your filters."
                            }
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedShoes.map((shoe) => (
                          <TableRow key={shoe._id}>
                            <TableCell className="font-mono font-bold">
                              {shoe.shoeId || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{shoe.sku}</TableCell>
                            <TableCell>{shoe.brand}</TableCell>
                            <TableCell>{shoe.modelName}</TableCell>
                            <TableCell>{shoe.sport}</TableCell>
                            <TableCell>{shoe.size}</TableCell>
                            <TableCell>{shoe.color}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {shoe.condition && typeof shoe.condition === 'string' 
                                  ? shoe.condition.replace('_', ' ')
                                  : shoe.condition || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>{shoe.gender}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={getInventoryBadgeStyle(shoe.inventoryCount)}>
                                {shoe.inventoryCount}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeStyle(shoe.status)}>
                                {shoe.status && typeof shoe.status === 'string'
                                  ? shoe.status.replace('_', ' ')
                                  : shoe.status || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {shoe.donorName ? (
                                <div className="flex flex-col">
                                  <span>{shoe.donorName}</span>
                                  <Badge variant="outline" className="mt-1 w-fit flex items-center gap-1 whitespace-nowrap">
                                    <Globe className="h-3 w-3" />
                                    <span>Online</span>
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                  <Store className="h-3 w-3" />
                                  <span>Offline</span>
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {shoe.referenceNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center py-1 px-0">
                              <div className="inline-flex gap-0.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => router.push(`/admin/shoes/edit/${shoe._id}`)}
                                >
                                  <Edit className="h-3 w-3" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(shoe._id)}
                                >
                                  <Trash className="h-3 w-3" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              <div className="mt-6 border-t pt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={filteredShoes.length}
                  itemsPerPage={pagination.itemsPerPage}
                  itemsPerPageOptions={[10, 20, 50, 100]}
                  onPageChange={pagination.setCurrentPage}
                  onItemsPerPageChange={pagination.setItemsPerPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 