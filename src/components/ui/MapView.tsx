"use client";

import { useState, useCallback, memo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  icon?: string;
}

export interface MapViewProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  showControls?: boolean;
}

// Default center: Johannesburg, South Africa
const defaultCenter = { lat: -26.2041, lng: 28.0473 };

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

function MapViewComponent({
  markers = [],
  center,
  zoom = 12,
  height = "400px",
  className,
  onMarkerClick,
  showControls = true,
}: MapViewProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Fit bounds to markers if multiple
    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      map.fitBounds(bounds);
    }
  }, [markers]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    onMarkerClick?.(marker);
  };

  // Calculate center from markers if not provided
  const mapCenter = center || (markers.length > 0
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : defaultCenter);

  const options: google.maps.MapOptions = {
    ...defaultOptions,
    disableDefaultUI: !showControls,
    zoomControl: showControls,
    fullscreenControl: showControls,
  };

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPinIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">
            Google Maps API key not configured
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-error text-sm">Failed to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
        style={{ height }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg overflow-hidden", className)}
      style={{ height }}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={options}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.title}
            onClick={() => handleMarkerClick(marker)}
            icon={marker.icon}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-[200px]">
              {selectedMarker.title && (
                <h3 className="font-semibold text-sm text-gray-900">
                  {selectedMarker.title}
                </h3>
              )}
              {selectedMarker.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {selectedMarker.description}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MapView = memo(MapViewComponent);

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}
