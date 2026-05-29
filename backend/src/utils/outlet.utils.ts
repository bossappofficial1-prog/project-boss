import { OutletOperatingHours } from "@prisma/client";

const WIB_OFFSET_MINUTES = 7 * 60; // UTC+7

function parseDate(date: Date | string): Date {
    if (date instanceof Date) return date;
    const dateStr = typeof date === 'string' ? date : String(date);
    return new Date(dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('-') ? dateStr : dateStr + 'Z');
}

function convertToOffsetMinutes(date: Date | string, offsetMinutes: number) {
    const parsedDate = parseDate(date);
    const totalUtcMinutes = parsedDate.getUTCHours() * 60 + parsedDate.getUTCMinutes();
    const totalWithOffset = totalUtcMinutes + offsetMinutes;
    let minutesOfDay = totalWithOffset % 1440;
    if (minutesOfDay < 0) {
        minutesOfDay += 1440;
    }
    const dayOffset = Math.floor((totalUtcMinutes + offsetMinutes) / 1440);
    return { minutesOfDay, dayOffset };
}

function getWibMinutes(date: Date | string) {
    return convertToOffsetMinutes(date, WIB_OFFSET_MINUTES).minutesOfDay;
}

function getWibDay(date: Date | string) {
    const parsedDate = parseDate(date);
    const utcDay = parsedDate.getUTCDay();
    const { dayOffset } = convertToOffsetMinutes(parsedDate, WIB_OFFSET_MINUTES);
    const wibDay = (utcDay + dayOffset) % 7;
    return wibDay < 0 ? wibDay + 7 : wibDay;
}

export interface Location {
    latitude: number;
    longitude: number;
}

export const getIsOutletOpen = (operatingHours: any[], today: Date | string) => {
    const todayMinutes = getWibMinutes(today);
    const todayDay = getWibDay(today);

    return operatingHours.some((oper) => {
        if (!oper.isOpen) return false;

        const openMinutes = getWibMinutes(oper.openTime);
        const closeMinutes = getWibMinutes(oper.closeTime);
        const scheduleDay = oper.dayOfWeek;
        const sameDay = scheduleDay === todayDay;

        // 24 jam (open == close) dianggap selalu buka di hari tersebut
        let isShiftOpen = false;
        let isLateSameDay = false;
        let isEarlyNextDay = false;
        const nextDay = (scheduleDay + 1) % 7;

        if (openMinutes === closeMinutes) {
            isShiftOpen = sameDay;
        } else if (closeMinutes > openMinutes) {
            // Tutup di hari yang sama
            isShiftOpen = sameDay && todayMinutes >= openMinutes && todayMinutes < closeMinutes;
        } else {
            // Tutup lewat tengah malam (closeMinutes < openMinutes)
            isLateSameDay = sameDay && todayMinutes >= openMinutes;
            isEarlyNextDay = todayDay === nextDay && todayMinutes < closeMinutes;
            isShiftOpen = isLateSameDay || isEarlyNextDay;
        }

        if (!isShiftOpen) return false;

        // Cek jika sedang istirahat (breakStart & breakEnd)
        if (oper.breakStart && oper.breakEnd) {
            const breakOpen = getWibMinutes(oper.breakStart);
            const breakClose = getWibMinutes(oper.breakEnd);

            if (breakOpen !== breakClose) {
                let isResting = false;
                if (breakClose > breakOpen) {
                    // Istirahat tidak melewati tengah malam
                    if (breakOpen >= openMinutes) {
                        // Istirahat berada pada hari pertama shift (sameDay)
                        isResting = sameDay && todayMinutes >= breakOpen && todayMinutes < breakClose;
                    } else {
                        // Istirahat berada pada hari berikutnya (nextDay)
                        isResting = todayDay === nextDay && todayMinutes >= breakOpen && todayMinutes < breakClose;
                    }
                } else {
                    // Istirahat melewati tengah malam
                    const isRestingLate = sameDay && todayMinutes >= breakOpen;
                    const isRestingEarly = todayDay === nextDay && todayMinutes < breakClose;
                    isResting = isRestingLate || isRestingEarly;
                }

                if (isResting) {
                    return false; // Sedang istirahat, jadi outlet tutup
                }
            }
        }

        return true;
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

export function mapOutletsWithOpenStatus(outlets: any[], today: Date | string = new Date()) {
    return outlets.map((outlet) => ({
        ...outlet,
        isOpen: outlet.isOpen && (
            outlet.operatingHours.length > 0
                ? getIsOutletOpen(outlet.operatingHours, today)
                : false
        )
    }));
}

export function removeOperatingHoursFromOutlets(outlets: any[]) {
    return outlets.map((outlet) => {
        const { operatingHours, ...others } = outlet;
        return others;
    });
}
