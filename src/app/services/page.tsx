import { Metadata } from "next";
import { Header } from "@/components/layout";
import { ServiceList } from "@/components/services/ServiceList";

export const metadata: Metadata = {
  title: "Browse Services | Mzansi Market",
  description: "Find and book local services from trusted providers in South Africa",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Services</h1>
          <p className="text-muted-foreground">
            Discover local services from trusted providers across South Africa
          </p>
        </div>

        {/* Service List with Filters */}
        <ServiceList showFilters />
      </div>
    </div>
  );
}
