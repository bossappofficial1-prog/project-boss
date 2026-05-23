"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/shared/Map"), {
  loading: () => (
    <div className="w-full h-[300px] bg-muted animate-pulse rounded-lg" />
  ),
  ssr: false,
});

type MapContainerProps = {
  center: [number, number];
  zoom: number;
  markers: Array<{
    position: [number, number];
    popup: string;
  }>;
  className?: string;
};

export function MapContainer({ className, ...props }: MapContainerProps) {
  return (
    <div className={className || "h-75 rounded-lg overflow-hidden"}>
      <Map {...props} />
    </div>
  );
}
