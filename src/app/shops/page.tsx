"use client";

import { useState, useEffect } from "react";
import { ShopCard } from "@/components/shops/ShopCard";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  province?: string | null;
  rating: number;
  reviewCount: number;
  coverImage?: string | null;
  logo?: string | null;
  isFeatured?: boolean;
  openingHours?: string | null;
  closingHours?: string | null;
  user?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    picture?: string | null;
  };
  _count?: {
    services: number;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");

      if (search) params.set("search", search);
      if (city) params.set("city", city);
      if (category) params.set("category", category);

      const response = await fetch(`/api/shops?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setShops(data.shops);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShops();
  };

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setCategory("");
    setPage(1);
    fetchShops();
  };

  const hasActiveFilters = search || city || category;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shop Finder</h1>
          <p className="text-muted-foreground">
            Discover local service providers in South Africa
          </p>
        </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shops..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </form>

        {showFilters && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City/Location
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Johannesburg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Service Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => { setPage(1); fetchShops(); }}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Shops Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No shops found</p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-8">
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
    </div>
  );
}
