"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, Button, Input, Badge, Spinner } from "@/components/ui";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ShopCard } from "@/components/shops/ShopCard";
import { Search, Filter, MapPin, SlidersHorizontal, LayoutGrid, Map } from "lucide-react";
import { ShopsMapView } from "@/components/search";

interface SearchResult {
  services: any[];
  shops: any[];
  jobs: any[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult>({ services: [], shops: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "services" | "shops" | "jobs">("all");
  const [filters, setFilters] = useState({
    city: "",
    minPrice: "",
    maxPrice: "",
    rating: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [shopsViewMode, setShopsViewMode] = useState<"grid" | "map">("grid");

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(filters.city && { city: filters.city }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.rating && { rating: filters.rating }),
      });

      const [servicesRes, shopsRes, jobsRes] = await Promise.all([
        fetch(`/api/services?search=${searchQuery}&limit=12`),
        fetch(`/api/shops?search=${searchQuery}&limit=12`),
        fetch(`/api/jobs?search=${searchQuery}&limit=12`),
      ]);

      const [servicesData, shopsData, jobsData] = await Promise.all([
        servicesRes.ok ? servicesRes.json() : { services: [] },
        shopsRes.ok ? shopsRes.json() : { shops: [] },
        jobsRes.ok ? jobsRes.json() : { jobs: [] },
      ]);

      setResults({
        services: servicesData.services || [],
        shops: shopsData.shops || [],
        jobs: jobsData.jobs || [],
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      performSearch(query);
    }
  };

  const totalResults = results.services.length + results.shops.length + results.jobs.length;

  const cities = [
    "Johannesburg",
    "Cape Town",
    "Durban",
    "Pretoria",
    "Port Elizabeth",
    "Bloemfontein",
    "East London",
    "Polokwane",
    "Nelspruit",
    "Kimberley",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Search Header */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search services, shops, or jobs..."
                  className="w-full pl-12 pr-24 py-4 text-lg"
                />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              {query && (
                <p className="text-muted-foreground">
                  {loading ? "Searching..." : `${totalResults} results for "${query}"`}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City
                    </label>
                    <select
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Min Price
                    </label>
                    <Input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      placeholder="R 0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Price
                    </label>
                    <Input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      placeholder="R 10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Min Rating
                    </label>
                    <select
                      value={filters.rating}
                      onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ city: "", minPrice: "", maxPrice: "", rating: "" })}
                  >
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={() => performSearch(query)}>
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "all", label: `All (${totalResults})` },
              { id: "services", label: `Services (${results.services.length})` },
              { id: "shops", label: `Shops (${results.shops.length})` },
              { id: "jobs", label: `Jobs (${results.jobs.length})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !query ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Search Mzansi Market
              </h2>
              <p className="text-muted-foreground">
                Find services, shops, and job opportunities
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No results found
              </h2>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/services">Browse Services</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/shops">Browse Shops</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Services Results */}
              {(activeTab === "all" || activeTab === "services") && results.services.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Services</h2>
                    {activeTab === "all" && results.services.length > 6 && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("services")}>
                        View All
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(activeTab === "all" ? results.services.slice(0, 6) : results.services).map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              )}

              {/* Shops Results */}
              {(activeTab === "all" || activeTab === "shops") && results.shops.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Shops</h2>
                    <div className="flex items-center gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setShopsViewMode("grid")}
                          className={`p-2 ${
                            shopsViewMode === "grid"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-muted"
                          }`}
                          title="Grid view"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShopsViewMode("map")}
                          className={`p-2 ${
                            shopsViewMode === "map"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-muted"
                          }`}
                          title="Map view"
                        >
                          <Map className="w-4 h-4" />
                        </button>
                      </div>
                      {activeTab === "all" && results.shops.length > 6 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("shops")}>
                          View All
                        </Button>
                      )}
                    </div>
                  </div>

                  {shopsViewMode === "map" ? (
                    <ShopsMapView
                      shops={activeTab === "all" ? results.shops.slice(0, 6) : results.shops}
                      onMarkerClick={(shopId) => window.location.href = `/shops/${shopId}`}
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(activeTab === "all" ? results.shops.slice(0, 6) : results.shops).map((shop) => (
                        <ShopCard key={shop.id} shop={shop} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Jobs Results */}
              {(activeTab === "all" || activeTab === "jobs") && results.jobs.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Jobs</h2>
                    {activeTab === "all" && results.jobs.length > 6 && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("jobs")}>
                        View All
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(activeTab === "all" ? results.jobs.slice(0, 6) : results.jobs).map((job) => (
                      <Card key={job.id}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-foreground mb-2">{job.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {job.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{job.status}</Badge>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/jobs/${job.id}`}>View</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
