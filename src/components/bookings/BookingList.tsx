"use client";

import { useState, useEffect } from "react";
import { BookingCard } from "./BookingCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Calendar } from "lucide-react";

interface Booking {
  id: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  address?: string | null;
  service?: {
    id: string;
    name: string;
    price?: number | null;
    chargeTime?: string | null;
  } | null;
  requester?: {
    id: string;
    username: string;
    picture?: string | null;
    phone?: string | null;
  };
  provider?: {
    id: string;
    username: string;
    picture?: string | null;
    phone?: string | null;
    shop?: {
      id: string;
      name: string;
      address?: string | null;
    } | null;
  };
}

interface BookingListProps {
  role: "client" | "provider";
}

const statusTabs = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function BookingList({ role }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("role", role);
      params.set("page", page.toString());
      params.set("limit", "10");
      if (activeTab !== "all") {
        params.set("status", activeTab);
      }

      const response = await fetch(`/api/appointments?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.appointments);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [role, activeTab, page]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update local state
        setBookings(
          bookings.map((b) => (b.id === id ? { ...b, status } : b))
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }}>
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Bookings */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {activeTab === "all"
              ? "No bookings yet"
              : `No ${activeTab.toLowerCase()} bookings`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role={role}
                onStatusChange={handleStatusChange}
              />
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
