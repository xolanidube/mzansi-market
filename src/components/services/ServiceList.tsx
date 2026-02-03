"use client";

import { useState, useEffect } from "react";
import { ServiceCard } from "./ServiceCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  chargeTime: string;
  category: string;
  subcategory?: string | null;
  duration?: number | null;
  image?: string | null;
  isFeatured?: boolean;
  user?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    picture?: string | null;
    shop?: {
      id: string;
      name: string;
      city?: string | null;
      rating: number;
    } | null;
  };
}

interface ServiceListProps {
  initialServices?: Service[];
  showFilters?: boolean;
  category?: string;
  userId?: string;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "beauty", label: "Beauty & Wellness" },
  { value: "home", label: "Home Services" },
  { value: "automotive", label: "Automotive" },
  { value: "tech", label: "Technology" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health & Fitness" },
  { value: "events", label: "Events" },
  { value: "professional", label: "Professional" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "createdAt-desc", label: "Newest" },
  { value: "createdAt-asc", label: "Oldest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
];

export function ServiceList({
  initialServices,
  showFilters = true,
  category: initialCategory,
  userId,
}: ServiceListProps) {
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [isLoading, setIsLoading] = useState(!initialServices);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");

      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (city) params.set("city", city);
      if (userId) params.set("userId", userId);

      const [sortField, sortOrder] = sortBy.split("-");
      params.set("sortBy", sortField);
      params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/services?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setServices(data.services);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialServices) {
      fetchServices();
    }
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const clearFilters = () => {
    setSearch("");
    setCategory(initialCategory || "");
    setMinPrice("");
    setMaxPrice("");
    setCity("");
    setSortBy("createdAt-desc");
    setPage(1);
    fetchServices();
  };

  const hasActiveFilters = search || category || minPrice || maxPrice || city;

  return (
    <div className="space-y-6">
      {showFilters && (
        <>
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </form>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Min Price</label>
                  <Input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="R0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Price</label>
                  <Input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">City</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Johannesburg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-input rounded-md bg-background text-sm"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => { setPage(1); fetchServices(); }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services found</p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
