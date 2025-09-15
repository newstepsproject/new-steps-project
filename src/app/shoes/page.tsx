'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  Footprints, 
  CreditCard, 
  Search, 
  Filter, 
  Star, 
  ChevronDown,
  SlidersHorizontal,
  Hash
} from 'lucide-react';
import { 
  SHOE_SPORTS, 
  SHOE_BRANDS, 
  SHOE_GENDERS, 
  SHOE_CONDITIONS,
  US_MEN_SIZES,
  US_WOMEN_SIZES,
  US_YOUTH_SIZES,
  SHOE_STATUSES
} from '@/constants/config';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";
import { useCart } from '@/components/cart/CartProvider';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

export default function ShoesPage() {
  // Cart functionality
  const { addItem, isInCart, canAddMore, itemCount, maxItems } = useCart();
  
  // State for shoes data
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sort sports and brands alphabetically
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));

  // Fetch shoes from API
  useEffect(() => {
    const fetchShoes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/shoes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch shoes');
        }
        
        const data = await response.json();
        // Filter only available shoes with inventory > 0
        const availableShoes = (data.shoes || []).filter(shoe => 
          shoe.status === SHOE_STATUSES.AVAILABLE && shoe.inventoryCount > 0
        );
        setShoes(availableShoes);
      } catch (err) {
        console.error('Error fetching shoes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShoes();
  }, []);

  // Filter shoes based on search query
  const filteredShoes = shoes.filter(shoe => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Check if search query is numeric for shoe ID matching
    const numericQuery = parseInt(searchQuery, 10);
    if (!isNaN(numericQuery)) {
      return shoe.shoeId === numericQuery ||
             shoe.brand.toLowerCase().includes(query) ||
             shoe.modelName.toLowerCase().includes(query) ||
             shoe.sport.toLowerCase().includes(query) ||
             shoe.color.toLowerCase().includes(query);
    }
    
    // Text-based search
    return shoe.brand.toLowerCase().includes(query) ||
           shoe.modelName.toLowerCase().includes(query) ||
           shoe.sport.toLowerCase().includes(query) ||
           shoe.color.toLowerCase().includes(query);
  });

  // Pagination logic
  const pagination = usePagination({
    totalItems: filteredShoes.length,
    defaultItemsPerPage: 12, // 3 columns × 4 rows
  });

  // Get current page data
  const paginatedShoes = pagination.getPageData(filteredShoes);

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.resetToFirstPage();
  }, [searchQuery, selectedSport, selectedBrand, selectedGender, selectedCondition, selectedSize]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedSport('all');
    setSelectedBrand('all');
    setSelectedGender('all');
    setSelectedCondition('all');
    setSelectedSize('all');
    setSearchQuery('');
  };

  // Helper function to get all available sizes based on selected gender
  const getAvailableSizes = (gender: string) => {
    if (!gender || gender === 'all') {
      // If no gender is selected, combine all size arrays and remove duplicates
      return [...new Set([...US_MEN_SIZES, ...US_WOMEN_SIZES, ...US_YOUTH_SIZES])];
    }
    
    if (gender === 'men') return US_MEN_SIZES;
    if (gender === 'women') return US_WOMEN_SIZES;
    if (gender === 'boys' || gender === 'girls') return US_YOUTH_SIZES;
    if (gender === 'unisex') return US_MEN_SIZES; // Default to men's sizes for unisex
    
    return [...new Set([...US_MEN_SIZES, ...US_WOMEN_SIZES, ...US_YOUTH_SIZES])];
  };

  // Map condition values for display
  const getConditionDisplay = (condition) => {
    switch(condition) {
      case 'like_new': return 'Like New';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      default: return condition;
    }
  };

  // Map gender values for display
  const getGenderDisplay = (gender) => {
    switch(gender) {
      case 'men': return 'Men';
      case 'women': return 'Women';
      case 'boys': return 'Boys';
      case 'girls': return 'Girls';
      case 'unisex': return 'Unisex';
      default: return gender;
    }
  };

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Find Shoes Ready to Return to Action</h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-6">
            Browse quality sports shoes from fellow athletes who want their beloved kicks to continue playing.
            From basketball to running shoes - find your perfect pair and make them yours completely free.
          </p>
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by ID, name, brand, or sport..."
              className="pl-10 pr-16"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              variant="ghost" 
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setSearchQuery('')}
            >
              {searchQuery && "Clear"}
            </Button>
          </div>
        </div>
      </section>

      {/* Shoes Catalog */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Available Shoes</h2>
            <div className="flex gap-4">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Filter Shoes</SheetTitle>
                    <SheetDescription>
                      Narrow down options based on your preferences
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 overflow-y-auto flex-1">
                    {renderFilterControls()}
                    <Button 
                      onClick={clearFilters} 
                      variant="outline" 
                      className="w-full mt-4"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="hidden md:flex"
                disabled={
                  selectedSport === 'all' && 
                  selectedBrand === 'all' && 
                  selectedGender === 'all' && 
                  selectedCondition === 'all' && 
                  selectedSize === 'all' && 
                  !searchQuery
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Desktop Filters Sidebar */}
            <div className="hidden md:block w-64 bg-white p-6 rounded-lg shadow-sm">
              <div className="mb-6">
                <h3 className="font-bold text-base mb-3">Filters</h3>
                {renderFilterControls()}
              </div>
            </div>

            {/* Shoes Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-red-600 mb-4">Error loading shoes: {error}</p>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
              ) : filteredShoes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Footprints className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No shoes match your criteria</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters to find more options</p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">{filteredShoes.length} shoes found</p>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-gray-600">Sort by:</span>
                      <select 
                        className="text-sm border rounded-md p-1"
                        defaultValue="newest"
                      >
                        <option value="newest">Newest</option>
                        <option value="condition">Best Condition</option>
                        <option value="size">Size</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedShoes.map((shoe) => (
                      <div key={shoe._id} className="bg-white rounded-lg shadow-sm border overflow-hidden group hover:shadow-md transition-shadow">
                        <Link href={`/shoes/${shoe._id}`}>
                          <div className="relative aspect-square">
                            <img
                              src={shoe.images?.[0] || '/images/placeholder-shoe.jpg'}
                              alt={`${shoe.brand} ${shoe.modelName}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Prominent Shoe ID Badge */}
                            <div className="absolute top-2 right-2 z-10">
                              <div className="bg-brand text-white px-2 py-1 rounded text-xs font-mono font-bold">
                                ID: {shoe.shoeId}
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs">
                              {getConditionDisplay(shoe.condition)}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {shoe.brand} {shoe.modelName}
                              </h3>
                              <div className="ml-2 text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  Size {shoe.size}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getGenderDisplay(shoe.gender)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                              <span>{shoe.sport}</span>
                              <span className="text-gray-900 font-medium">{shoe.color}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                <span className="text-green-700">Available</span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-8 px-3 hover:bg-brand hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const success = addItem({
                                    id: shoe._id, // Missing required field!
                                    shoeId: shoe.shoeId,
                                    inventoryId: shoe._id,
                                    name: shoe.modelName,
                                    brand: shoe.brand,
                                    modelName: shoe.modelName,
                                    size: shoe.size,
                                    color: shoe.color,
                                    sport: shoe.sport,
                                    condition: shoe.condition,
                                    gender: shoe.gender ?? 'unisex',
                                    image: shoe.images[0] || '/images/placeholder-shoe.jpg',
                                    quantity: 1,
                                    notes: ''
                                  });
                                  if (!success) {
                                    toast({
                                      title: "Cart Limit Reached",
                                      description: `You can only request up to ${maxItems} shoes at a time.`,
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({
                                      title: "Added to Cart",
                                      description: `${shoe.brand} ${shoe.modelName} (ID: ${shoe.shoeId}) added to your request.`,
                                    });
                                  }
                                }}
                                disabled={isInCart(shoe._id) || (!isInCart(shoe._id) && !canAddMore)}
                              >
                                {isInCart(shoe._id) 
                                  ? 'In Cart' 
                                  : !canAddMore 
                                    ? 'Cart Limit Reached' 
                                    : 'Add to Cart'}
                              </Button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="mt-8 border-t pt-6">
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalItems={filteredShoes.length}
                      itemsPerPage={pagination.itemsPerPage}
                      itemsPerPageOptions={[6, 12, 24, 48]}
                      onPageChange={pagination.setCurrentPage}
                      onItemsPerPageChange={pagination.setItemsPerPage}
                      className="justify-center"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action for Donations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Keep the Cycle Going - Send Your Shoes Back to Fields</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            When you're ready, your lovely shoes can return to action too! Help other young athletes
            by sending your cherished kicks back to the fields, courts, and tracks where they belong.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" className="shadow-sm">
              <Link href="/donate/shoes">
                Send Shoes Back to Action <Footprints className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-energy text-energy hover:bg-energy hover:text-white">
                              <Link href="/get-involved#money-donation">
                  Support Our Mission <CreditCard className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );

  // Helper function to render filter controls (used in both mobile and desktop)
  function renderFilterControls() {
    return (
      <Accordion type="multiple" defaultValue={['sport', 'gender', 'condition']} className="text-sm">
        <AccordionItem value="sport">
          <AccordionTrigger className="text-sm py-2 hover:no-underline hover:text-brand">Sport</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select value={selectedSport} onValueChange={setSelectedSport}>
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
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="brand">
          <AccordionTrigger className="text-sm py-2 hover:no-underline hover:text-brand">Brand</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
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
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="gender">
          <AccordionTrigger className="text-sm py-2 hover:no-underline hover:text-brand">Gender</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="condition">
          <AccordionTrigger className="text-sm py-2 hover:no-underline hover:text-brand">Condition</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Condition</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="size">
          <AccordionTrigger className="text-sm py-2 hover:no-underline hover:text-brand">Size</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Size</SelectItem>
                  {getAvailableSizes(selectedGender).sort((a, b) => {
                    // Sort numerically, accounting for youth sizes with Y suffix
                    const aNum = parseFloat(a.replace('Y', ''));
                    const bNum = parseFloat(b.replace('Y', ''));
                    return aNum - bNum;
                  }).map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
}
