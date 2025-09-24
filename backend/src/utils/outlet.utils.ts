import { OutletOperatingHours } from "@prisma/client";

export interface Location {
    latitude: number;
    longitude: number;
}

export const getIsOutletOpen = (operatingHours: OutletOperatingHours[], today: Date) => {
    const wibHours = (today.getUTCHours() + 7) % 24;
    return operatingHours.some((oper) => {
        const todayMinutes = wibHours * 60 + today.getUTCMinutes(); // Total menit saat ini
        const openMinutes = ((oper.openTime.getUTCHours() + 7) % 24) * 60 + oper.openTime.getUTCMinutes(); // Total menit waktu buka
        const closeMinutes = ((oper.closeTime.getUTCHours() + 7) % 24) * 60 + oper.closeTime.getUTCMinutes(); // Total menit waktu tutup

        return oper.dayOfWeek === today.getDay() && todayMinutes >= openMinutes && todayMinutes <= closeMinutes && oper.isOpen;
    });
}

export function calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadian(point2.latitude - point1.latitude);
    const dLon = toRadian(point2.longitude - point1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadian(point1.latitude)) * Math.cos(toRadian(point2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function toRadian(degree: number): number {
    return degree * Math.PI / 180;
}

export function validateCoordinates(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) {
        throw new Error('Invalid latitude. Must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
        throw new Error('Invalid longitude. Must be between -180 and 180');
    }
}

export function calculateBoundingBox(latitude: number, longitude: number, radiusKm: number) {
    const latRadian = latitude * Math.PI / 180;
    const degLatKm = 110.574; // Approximate degrees per km at the equator
    const degLongKm = 111.320 * Math.cos(latRadian); // Adjust for latitude

    const latDiff = radiusKm / degLatKm;
    const longDiff = radiusKm / degLongKm;

    return {
        latMin: latitude - latDiff,
        latMax: latitude + latDiff,
        longMin: longitude - longDiff,
        longMax: longitude + longDiff
    };
}

export function validatePaginationParams(page: number, limit: number) {
    if (page < 1) {
        throw new Error('Page must be greater than 0');
    }
    if (limit < 1) {
        throw new Error('Limit must be greater than 0');
    }
}

export function validateRadius(radiusKm: number) {
    if (radiusKm <= 0) {
        throw new Error('Radius must be greater than 0');
    }
}

export function mapOutletsWithOpenStatus(outlets: any[], today: Date = new Date()) {
    return outlets.map((outlet) => ({
        ...outlet,
        isOpen: outlet.isOpen && outlet.operatingHours.length > 0
            ? getIsOutletOpen(outlet.operatingHours, today)
            : outlet.isOpen
    }));
}

export function removeOperatingHoursFromOutlets(outlets: any[]) {
    return outlets.map((outlet) => {
        const { operatingHours, ...others } = outlet;
        return others;
    });
}
