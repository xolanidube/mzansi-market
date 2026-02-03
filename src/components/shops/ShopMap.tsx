"use client";

import { MapView } from "@/components/ui/MapView";

interface ShopMapProps {
  shopName: string;
  address?: string | null;
  className?: string;
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
  midrand: { lat: -25.9891, lng: 28.1276 },
  centurion: { lat: -25.8603, lng: 28.1894 },
};

function getCoordinatesFromAddress(address: string): { lat: number; lng: number } {
  const lowerAddress = address.toLowerCase();

  // Check if any city name is in the address
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (lowerAddress.includes(city)) {
      return coords;
    }
  }

  // Check for province-based defaults
  if (lowerAddress.includes("gauteng")) {
    return cityCoordinates.johannesburg;
  }
  if (lowerAddress.includes("western cape")) {
    return cityCoordinates["cape town"];
  }
  if (lowerAddress.includes("kwazulu") || lowerAddress.includes("kzn")) {
    return cityCoordinates.durban;
  }
  if (lowerAddress.includes("eastern cape")) {
    return cityCoordinates["port elizabeth"];
  }
  if (lowerAddress.includes("free state")) {
    return cityCoordinates.bloemfontein;
  }
  if (lowerAddress.includes("limpopo")) {
    return cityCoordinates.polokwane;
  }
  if (lowerAddress.includes("mpumalanga")) {
    return cityCoordinates.nelspruit;
  }
  if (lowerAddress.includes("northern cape")) {
    return cityCoordinates.kimberley;
  }

  // Default to Johannesburg
  return cityCoordinates.johannesburg;
}

export function ShopMap({ shopName, address, className }: ShopMapProps) {
  if (!address) {
    return null;
  }

  const coordinates = getCoordinatesFromAddress(address);

  return (
    <MapView
      markers={[
        {
          id: "shop-location",
          lat: coordinates.lat,
          lng: coordinates.lng,
          title: shopName,
          description: address,
        },
      ]}
      center={coordinates}
      zoom={14}
      height="200px"
      className={className}
    />
  );
}
