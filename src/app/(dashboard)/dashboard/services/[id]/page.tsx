"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { ServiceForm } from "@/components/services/ServiceForm";

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
  tags: string[];
  userId: string;
}

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load service");
        }

        // Check if the service belongs to the current user
        if (data.service.userId !== session?.user?.id) {
          router.push("/dashboard/services");
          return;
        }

        setService(data.service);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchService();
    }
  }, [id, session?.user?.id, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!service) {
    return <Alert variant="error">Service not found</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Service</h1>
        <p className="text-muted-foreground mt-1">Update your service details</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ServiceForm
            initialData={{
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price.toString(),
              chargeTime: service.chargeTime,
              category: service.category,
              subcategory: service.subcategory || "",
              duration: service.duration?.toString() || "",
              tags: service.tags,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
