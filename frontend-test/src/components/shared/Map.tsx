"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix Leaflet marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type MapProps = {
    center: [number, number];
    zoom: number;
    markers: Array<{
        position: [number, number];
        popup: string | TrustedHTML;
    }>;
};

const userLocationIcon = L.divIcon({
    className: "user-location-icon",
    html: `
    <div class="user-pin"></div>
`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const outletMarkerIcon = L.divIcon({
    className: "custom-map-pin",
    html: `<div></div>`, // HTML can be empty, we will style the container
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
});

export default function Map({ center, zoom = 13, markers }: MapProps) {
    const [userPos, setUserPos] = useState<[number, number] | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserPos([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                }
            );
        }
    }, []);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userPos && (
                <Marker position={userPos}
                    icon={userLocationIcon}
                >
                    <Popup>Lokasi Kamu</Popup>
                </Marker>
            )}
            {markers.map((marker, index) => (
                <Marker key={index} position={marker.position} icon={outletMarkerIcon}>
                    <Popup>
                        <div
                            className="min-w-[150]"
                            dangerouslySetInnerHTML={{ __html: marker.popup }}
                        ></div>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${marker.position[0]},${marker.position[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            Arahkan
                        </a>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
