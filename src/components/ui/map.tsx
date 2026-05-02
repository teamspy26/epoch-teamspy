'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629 // Center of India, fallback
};

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  icon?: string;
}

export interface MapComponentProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  height?: string;
}

export default function MapComponent({ 
  markers = [], 
  center, 
  zoom = 12,
  origin,
  destination,
  height = '400px'
}: MapComponentProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'], // Ensure places library is loaded if needed elsewhere
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setDirections(null); // Clear directions if origin/dest are not provided
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  }, [origin, destination]);

  const mapCenter = center || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);

  if (!isLoaded) return <div className={`w-full bg-slate-100 flex items-center justify-center`} style={{ height }}>Loading Maps...</div>;

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        options={{
            disableDefaultUI: true,
            zoomControl: true,
        }}
      >
        {/* Render markers if not showing directions, as DirectionsRenderer adds its own */}
        {!directions && markers.map(marker => (
            <Marker key={marker.id} position={{ lat: marker.lat, lng: marker.lng }} title={marker.title} />
        ))}
        
        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{ 
              suppressMarkers: false, // Show A/B markers from directions
              polylineOptions: {
                strokeColor: "#1D9E75",
                strokeWeight: 5,
              }
            }} 
          />
        )}
      </GoogleMap>
    </div>
  );
}
