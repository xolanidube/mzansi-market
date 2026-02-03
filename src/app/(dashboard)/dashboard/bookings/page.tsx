"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookingList } from "@/components/bookings/BookingList";
import { Spinner } from "@/components/ui/Spinner";
import { Calendar } from "lucide-react";

export default function BookingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const isProvider = session?.user?.userType === "SERVICE_PROVIDER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          {isProvider ? "Appointments" : "My Bookings"}
        </h1>
        <p className="text-muted-foreground">
          {isProvider
            ? "Manage your upcoming appointments and booking requests"
            : "View and manage your service bookings"}
        </p>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isProvider ? "All Appointments" : "All Bookings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingList role={isProvider ? "provider" : "client"} />
        </CardContent>
      </Card>
    </div>
  );
}
