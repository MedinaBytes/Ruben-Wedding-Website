"use client";

import type { LatLngBounds, Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

import { weddingConfig } from "@/lib/wedding-config";

type VenueSelection = "all" | "ceremony" | "reception";
type MapStatus = "idle" | "loading" | "ready" | "error";

type MapInstance = {
  map: LeafletMap;
  ceremonyCoords: [number, number];
  receptionCoords: [number, number];
  bounds: LatLngBounds;
};

function createMarkerContent(title: string, subtitle: string, number: string) {
  const badge = document.createElement("div");
  badge.className = "map-pin-badge";

  const numberLabel = document.createElement("span");
  numberLabel.className = "map-pin-num";
  numberLabel.textContent = number;

  const content = document.createElement("div");
  content.className = "map-pin-content";

  const titleLabel = document.createElement("strong");
  titleLabel.textContent = title;

  const subtitleLabel = document.createElement("small");
  subtitleLabel.textContent = subtitle;

  content.append(titleLabel, subtitleLabel);
  badge.append(numberLabel, content);
  return badge;
}

function createPopupContent(title: string, address: string, schedule: string) {
  const content = document.createElement("div");
  content.className = "map-popup-inner";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const addressLabel = document.createElement("p");
  addressLabel.className = "map-popup-address";
  addressLabel.textContent = address;

  const scheduleLabel = document.createElement("p");
  scheduleLabel.className = "map-popup-time";
  scheduleLabel.textContent = schedule;

  content.append(heading, addressLabel, scheduleLabel);
  return content;
}

export function InteractiveMap({
  ceremonyLabel,
  receptionLabel,
  overviewLabel,
  regionLabel,
  loadingLabel,
  readyLabel,
  unavailableLabel,
  tileErrorLabel,
  arrivalLabel,
  beginsLabel,
  receptionFromLabel,
}: {
  ceremonyLabel: string;
  receptionLabel: string;
  overviewLabel: string;
  regionLabel: string;
  loadingLabel: string;
  readyLabel: string;
  unavailableLabel: string;
  tileErrorLabel: string;
  arrivalLabel: string;
  beginsLabel: string;
  receptionFromLabel: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>("idle");
  const [hasTileError, setHasTileError] = useState(false);
  const [activeVenue, setActiveVenue] = useState<VenueSelection>("all");

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoadMap(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoadMap) return;
    let isMounted = true;

    async function initializeMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      setMapStatus("loading");

      try {
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

        const centerLat = (ceremonyCoords[0] + receptionCoords[0]) / 2;
        const centerLng = (ceremonyCoords[1] + receptionCoords[1]) / 2;
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 15,
          keyboard: true,
          scrollWheelZoom: false,
          attributionControl: true,
        });
        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          className: "osm-tile-layer",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
        });
        tileLayer.on("tileerror", () => {
          if (isMounted) setHasTileError(true);
        });
        tileLayer.addTo(map);

        const ceremonyMarker = L.marker(ceremonyCoords, {
          icon: L.divIcon({
            className: "custom-map-pin",
            html: createMarkerContent(weddingConfig.ceremony.name, weddingConfig.ceremony.time, "1"),
            iconSize: [190, 48],
            iconAnchor: [95, 48],
          }),
          keyboard: true,
          title: ceremonyLabel,
        }).addTo(map);
        ceremonyMarker.bindPopup(createPopupContent(
          weddingConfig.ceremony.name,
          weddingConfig.ceremony.address,
          `${arrivalLabel}: ${weddingConfig.ceremony.guestArrival} · ${beginsLabel}: ${weddingConfig.ceremony.time}`,
        ));

        const receptionMarker = L.marker(receptionCoords, {
          icon: L.divIcon({
            className: "custom-map-pin",
            html: createMarkerContent(
              weddingConfig.reception.name,
              `~${weddingConfig.reception.approximateStart}`,
              "2",
            ),
            iconSize: [190, 48],
            iconAnchor: [95, 48],
          }),
          keyboard: true,
          title: receptionLabel,
        }).addTo(map);
        receptionMarker.bindPopup(createPopupContent(
          weddingConfig.reception.name,
          weddingConfig.reception.address,
          `${receptionFromLabel}: ~${weddingConfig.reception.approximateStart}`,
        ));

        L.polyline([ceremonyCoords, receptionCoords], {
          color: "var(--color-matcha-strong)",
          weight: 2,
          dashArray: "4, 7",
          opacity: 0.85,
        }).addTo(map);

        const bounds = L.latLngBounds([ceremonyCoords, receptionCoords]);
        map.fitBounds(bounds, { padding: [52, 52] });
        mapInstanceRef.current = { map, ceremonyCoords, receptionCoords, bounds };
        setMapStatus("ready");
      } catch {
        if (isMounted) setMapStatus("error");
      }
    }

    void initializeMap();

    return () => {
      isMounted = false;
      mapInstanceRef.current?.map.remove();
      mapInstanceRef.current = null;
    };
  }, [
    arrivalLabel,
    beginsLabel,
    ceremonyLabel,
    receptionFromLabel,
    receptionLabel,
    shouldLoadMap,
  ]);

  function focusVenue(venue: VenueSelection) {
    setActiveVenue(venue);
    const instance = mapInstanceRef.current;
    if (!instance) return;

    if (venue === "ceremony") {
      instance.map.setView(instance.ceremonyCoords, 16);
    } else if (venue === "reception") {
      instance.map.setView(instance.receptionCoords, 16);
    } else {
      instance.map.fitBounds(instance.bounds, { padding: [52, 52] });
    }
  }

  const statusMessage = hasTileError
    ? tileErrorLabel
    : mapStatus === "error"
      ? unavailableLabel
      : mapStatus === "ready"
        ? readyLabel
        : loadingLabel;

  return (
    <div className="interactive-map-wrapper" ref={wrapperRef}>
      <div aria-label={overviewLabel} className="interactive-map-toolbar" role="group">
        <button
          aria-pressed={activeVenue === "all"}
          className={`map-tab ${activeVenue === "all" ? "map-tab--active" : ""}`}
          disabled={mapStatus !== "ready"}
          onClick={() => focusVenue("all")}
          type="button"
        >
          {overviewLabel}
        </button>
        <button
          aria-pressed={activeVenue === "ceremony"}
          className={`map-tab ${activeVenue === "ceremony" ? "map-tab--active" : ""}`}
          disabled={mapStatus !== "ready"}
          onClick={() => focusVenue("ceremony")}
          type="button"
        >
          {ceremonyLabel}
        </button>
        <button
          aria-pressed={activeVenue === "reception"}
          className={`map-tab ${activeVenue === "reception" ? "map-tab--active" : ""}`}
          disabled={mapStatus !== "ready"}
          onClick={() => focusVenue("reception")}
          type="button"
        >
          {receptionLabel}
        </button>
      </div>
      <p aria-live="polite" className="interactive-map-status" role="status">{statusMessage}</p>
      <div
        aria-label={regionLabel}
        aria-busy={mapStatus === "loading" || mapStatus === "idle"}
        className="interactive-map-canvas"
        ref={mapContainerRef}
        role="region"
      />
    </div>
  );
}