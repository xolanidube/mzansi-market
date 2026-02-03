"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ServiceForm } from "@/components/services/ServiceForm";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Service</h1>
        <p className="text-muted-foreground mt-1">
          Create a new service to offer to customers
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
