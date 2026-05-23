import { useState, useEffect } from "react";

export function useUserPosition() {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [error, setError] = useState<GeolocationPositionError | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setError({
                code: 0,
                message: "Geolocation is not supported",
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3
            });
            setLoading(false);
            return;
        }

        // Watch user position in real-time
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude]);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            },
            {
                enableHighAccuracy: true, // Use high accuracy GPS if available
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return { position, error, loading };
}
