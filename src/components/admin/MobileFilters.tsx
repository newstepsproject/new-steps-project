'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';

interface MobileFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  filterOptions?: {
    statuses?: Array<string | { value: string; label: string }>;
    sports?: string[];
    brands?: string[];
    sources?: Array<{ value: string; label: string }>;
  };
  statusLabel?: string;
}

export function MobileFilters({ filters, onFilterChange, filterOptions = {}, statusLabel = 'Status' }: MobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  
  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value && value !== 'all' && value !== ''
  ).length;

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      status: 'all',
      sport: 'all',
      brand: 'all',
      source: 'all',
    };
    setTempFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <>
      {/* Mobile Search Bar and Filter Button */}
      <div className="flex gap-2 md:hidden mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 h-10"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="default" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {/* Status Filter */}
              {filterOptions.statuses && (
                <div>
                  <label className="text-sm font-medium mb-2 block">{statusLabel}</label>
                  <Select 
                    value={tempFilters.status || 'all'} 
                    onValueChange={(value) => setTempFilters({ ...tempFilters, status: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`All ${statusLabel}s`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {statusLabel}s</SelectItem>
                      {filterOptions.statuses.map((status) => {
                        if (typeof status === 'string') {
                          return (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </SelectItem>
                          );
                        } else {
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          );
                        }
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sport Filter */}
              {filterOptions.sports && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Sport</label>
                  <Select 
                    value={tempFilters.sport || 'all'} 
                    onValueChange={(value) => setTempFilters({ ...tempFilters, sport: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Sports" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sports</SelectItem>
                      {filterOptions.sports.map((sport) => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Brand Filter */}
              {filterOptions.brands && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Brand</label>
                  <Select 
                    value={tempFilters.brand || 'all'} 
                    onValueChange={(value) => setTempFilters({ ...tempFilters, brand: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {filterOptions.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Source Filter */}
              {filterOptions.sources && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Source</label>
                  <Select 
                    value={tempFilters.source || 'all'} 
                    onValueChange={(value) => setTempFilters({ ...tempFilters, source: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {filterOptions.sources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 md:hidden">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === 'all' || value === '' || key === 'search') return null;
            return (
              <Badge key={key} variant="secondary" className="pr-1">
                {key}: {value}
                <button
                  onClick={() => onFilterChange({ ...filters, [key]: key === 'search' ? '' : 'all' })}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </>
  );
} 