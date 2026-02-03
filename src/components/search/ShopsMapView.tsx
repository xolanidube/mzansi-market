"use client";

import { MapView, MapMarker } from "@/components/ui/MapView";

interface Shop {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  rating: number;
}

// Default coordinates for major South African cities
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  johannesburg: { lat: -26.2041, lng: 28.0473 },
  pretoria: { lat: -25.7461, lng: 28.1881 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  durban: { lat: -29.8587, lng: 31.0218 },
  "port elizabeth": { lat: -33.918, lng: 25.57 },
  bloemfontein: { lat: -29.0852, lng: 26.1596 },
  "east london": { lat: -33.0153, lng: 27.9116 },
  polokwane: { lat: -23.9045, lng: 29.4688 },
  nelspruit: { lat: -25.4753, lng: 30.9694 },
  kimberley: { lat: -28.7323, lng: 24.7623 },
  soweto: { lat: -26.2678, lng: 27.8585 },
  sandton: { lat: -26.1076, lng: 28.0567 },
};

function getCoordinatesForShop(shop: Shop): { lat: number; lng: number } {
  const address = shop.city?.toLowerCase() || "";

  // Check if any city name is in the address
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (address.includes(city)) {
      // Add slight random offset to prevent markers from overlapping
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.02,
        lng: coords.lng + (Math.random() - 0.5) * 0.02,
      };
    }
  }

  // Default to Johannesburg with random offset
  return {
    lat: cityCoordinates.johannesburg.lat + (Math.random() - 0.5) * 0.05,
    lng: cityCoordinates.johannesburg.lng + (Math.random() - 0.5) * 0.05,
  };
}

interface ShopsMapViewProps {
  shops: Shop[];
  onMarkerClick?: (shopId: string) => void;
}

export function ShopsMapView({ shops, onMarkerClick }: ShopsMapViewProps) {
  const markers: MapMarker[] = shops.map((shop) => {
    const coords = getCoordinatesForShop(shop);
    return {
      id: shop.id,
      lat: coords.lat,
      lng: coords.lng,
      title: shop.name,
      description: `${shop.rating.toFixed(1)} stars${shop.city ? ` - ${shop.city}` : ""}`,
    };
  });

  const handleMarkerClick = (marker: MapMarker) => {
    onMarkerClick?.(marker.id);
  };

  // Calculate center based on markers
  const center =
    markers.length > 0
      ? {
          lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
          lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
        }
      : cityCoordinates.johannesburg;

  return (
    <MapView
      markers={markers}
      center={center}
      zoom={markers.length > 1 ? 10 : 12}
      height="500px"
      onMarkerClick={handleMarkerClick}
      className="rounded-lg"
    />
  );
}
