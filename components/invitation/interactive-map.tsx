"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

import { weddingConfig } from "@/lib/wedding-config";

export function InteractiveMap({
  ceremonyLabel = "Ceremony: St. Oswald",
  receptionLabel = "Reception: Schloss Hetzendorf",
}: {
  ceremonyLabel?: string;
  receptionLabel?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [activeVenue, setActiveVenue] = useState<"all" | "ceremony" | "reception">("all");

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const ceremonyCoords: [number, number] = [
        weddingConfig.ceremony.coordinates.latitude,
        weddingConfig.ceremony.coordinates.longitude,
      ];
      const receptionCoords: [number, number] = [
        weddingConfig.reception.coordinates.latitude,
        weddingConfig.reception.coordinates.longitude,
      ];

      // Center between ceremony and reception
      const centerLat = (ceremonyCoords[0] + receptionCoords[0]) / 2;
      const centerLng = (ceremonyCoords[1] + receptionCoords[1]) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 15,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      // OpenStreetMap high quality tiles with custom CSS shader
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "osm-tile-layer",
      }).addTo(map);

      // Custom Botanical Gold Markers
      const createCustomIcon = (title: string, subtitle: string, badgeNumber: string) => {
        return L.divIcon({
          className: "custom-map-pin",
          html: `
            <div class="map-pin-badge">
              <span class="map-pin-num">${badgeNumber}</span>
              <div class="map-pin-content">
                <strong>${title}</strong>
                <small>${subtitle}</small>
              </div>
            </div>
          `,
          iconSize: [160, 48],
          iconAnchor: [80, 48],
        });
      };

      const ceremonyMarker = L.marker(ceremonyCoords, {
        icon: createCustomIcon(weddingConfig.ceremony.name, weddingConfig.ceremony.time, "1"),
      }).addTo(map);

      ceremonyMarker.bindPopup(`
        <div class="map-popup-inner">
          <h4>${weddingConfig.ceremony.name}</h4>
          <p class="map-popup-address">${weddingConfig.ceremony.address}</p>
          <p class="map-popup-time">Arrival: ${weddingConfig.ceremony.guestArrival} · Begins: ${weddingConfig.ceremony.time}</p>
        </div>
      `);

      const receptionMarker = L.marker(receptionCoords, {
        icon: createCustomIcon(weddingConfig.reception.name, `~${weddingConfig.reception.approximateStart}`, "2"),
      }).addTo(map);

      receptionMarker.bindPopup(`
        <div class="map-popup-inner">
          <h4>${weddingConfig.reception.name}</h4>
          <p class="map-popup-address">${weddingConfig.reception.address}</p>
          <p class="map-popup-time">Reception from: ~${weddingConfig.reception.approximateStart}</p>
        </div>
      `);

      // Sinuous route line connecting both venues
      const routeLine = L.polyline([ceremonyCoords, receptionCoords], {
        color: "#c29b62",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.85,
      }).addTo(map);

      // Fit bounds to show both
      const bounds = L.latLngBounds([ceremonyCoords, receptionCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });

      mapInstanceRef.current = { map, ceremonyCoords, receptionCoords, bounds, routeLine };
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        const inst = mapInstanceRef.current as { map?: { remove: () => void } };
        inst.map?.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function focusVenue(venue: "all" | "ceremony" | "reception") {
    setActiveVenue(venue);
    if (!mapInstanceRef.current) return;
    const { map, ceremonyCoords, receptionCoords, bounds } = mapInstanceRef.current as {
      map: { setView: (coords: [number, number], zoom: number) => void; fitBounds: (b: unknown, opts: unknown) => void };
      ceremonyCoords: [number, number];
      receptionCoords: [number, number];
      bounds: unknown;
    };

    if (venue === "ceremony") {
      map.setView(ceremonyCoords, 16);
    } else if (venue === "reception") {
      map.setView(receptionCoords, 16);
    } else {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  return (
    <div className="interactive-map-wrapper">
      <div className="interactive-map-toolbar">
        <button
          type="button"
          className={`map-tab ${activeVenue === "all" ? "map-tab--active" : ""}`}
          onClick={() => focusVenue("all")}
        >
          Overview (Both Venues)
        </button>
        <button
          type="button"
          className={`map-tab ${activeVenue === "ceremony" ? "map-tab--active" : ""}`}
          onClick={() => focusVenue("ceremony")}
        >
          {ceremonyLabel}
        </button>
        <button
          type="button"
          className={`map-tab ${activeVenue === "reception" ? "map-tab--active" : ""}`}
          onClick={() => focusVenue("reception")}
        >
          {receptionLabel}
        </button>
      </div>

      <div
        className="interactive-map-canvas"
        ref={mapContainerRef}
        role="region"
        aria-label="Interactive map showing wedding ceremony and reception venues in Vienna"
      />
    </div>
  );
}
