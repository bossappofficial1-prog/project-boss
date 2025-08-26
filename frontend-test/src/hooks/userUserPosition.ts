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

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude]);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );
    }, []);

    return { position, error, loading };
}
