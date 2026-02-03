"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button, Badge, Input, Spinner, Avatar } from "@/components/ui";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  provider: {
    id: string;
    username: string;
    email: string;
    picture: string | null;
    shop: {
      name: string;
    } | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    appointments: number;
  };
}

export default function AdminServicesPage() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [page, statusFilter]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/services?${params}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const handleAction = async (serviceId: string, action: "approve" | "reject" | "deactivate" | "activate") => {
    setActionLoading(serviceId);
    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, action }),
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Service Management</h1>
        <p className="text-muted-foreground">Approve, reject, or manage platform services</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">All Services</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </Card>

      {/* Services Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Provider</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Bookings</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-secondary/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description || "No description"}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={service.provider.picture}
                          name={service.provider.username}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            {service.provider.shop?.name || service.provider.username}
                          </p>
                          <p className="text-sm text-muted-foreground">{service.provider.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">
                        {service.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">R{service.price.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      {service.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">{service._count.appointments}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {!service.isActive ? (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleAction(service.id, "approve")}
                              disabled={actionLoading === service.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleAction(service.id, "reject")}
                              disabled={actionLoading === service.id}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAction(service.id, "deactivate")}
                            disabled={actionLoading === service.id}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
