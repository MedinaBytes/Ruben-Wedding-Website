"use client";

import { useEffect, useRef, useState } from "react";

export function LazyMap({
  name,
  address,
  title,
}: {
  name: string;
  address: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [apiKey]);

  const mapUrl = new URL("https://www.google.com/maps/embed/v1/place");
  if (!apiKey) return null;
  mapUrl.searchParams.set("key", apiKey);
  mapUrl.searchParams.set("q", `${name}, ${address}`);

  return (
    <div className="venue__map" ref={containerRef}>
      {isNearViewport ? (
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl.toString()}
          title={title}
        />
      ) : (
        <div aria-hidden="true" className="venue__map-placeholder" />
      )}
    </div>
  );
}