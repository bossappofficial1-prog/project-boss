import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { db } from '../config/prisma';
import { OperatingHoursRepository } from '../repositories/operating-hours.repository';

export const validateGuestCustomer = (req: Request, res: Response, next: NextFunction) => {
    const { guestCustomer } = req.body;

    if (!guestCustomer) {
        throw new AppError("Data guest customer diperlukan", HttpStatus.BAD_REQUEST);
    }

    const { name, phone } = guestCustomer;

    // 1. SECURITY: Advanced name validation
    if (name) {
        // Check for SQL injection patterns
        const sqlPatterns = /('|('')|;|--|\/\*|\*\/|xp_|sp_|exec|execute|drop|create|alter|insert|update|delete|union|select|script|javascript|vbscript)/gi;
        if (sqlPatterns.test(name)) {
            throw new AppError("Nama mengandung karakter yang tidak diizinkan", HttpStatus.BAD_REQUEST);
        }

        // Check for script injection
        const scriptPatterns = /<script|javascript:|onload=|onerror=|onclick=/gi;
        if (scriptPatterns.test(name)) {
            throw new AppError("Nama mengandung konten yang tidak diizinkan", HttpStatus.BAD_REQUEST);
        }

        // Check for excessive special characters
        const specialCharCount = (name.match(/[^a-zA-Z\s]/g) || []).length;
        if (specialCharCount > 2) {
            throw new AppError("Nama terlalu banyak mengandung karakter khusus", HttpStatus.BAD_REQUEST);
        }

        // Check for repeated characters (potential spam)
        const hasRepeatedChars = /(.)\1{4,}/.test(name);
        if (hasRepeatedChars) {
            throw new AppError("Nama mengandung pengulangan karakter yang berlebihan", HttpStatus.BAD_REQUEST);
        }
    }

    // 2. SECURITY: Advanced phone validation
    if (phone) {
        // Remove common formatting
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

        // Check for Indonesian phone number patterns
        const validPatterns = [
            /^08[0-9]{8,11}$/, // Indonesian mobile
            /^\+628[0-9]{8,11}$/, // Indonesian mobile with country code
            /^628[0-9]{8,11}$/, // Indonesian mobile without +
        ];

        const isValidIndonesianPhone = validPatterns.some(pattern => pattern.test(cleanPhone));
        if (!isValidIndonesianPhone) {
            throw new AppError("Format nomor telepon Indonesia tidak valid", HttpStatus.BAD_REQUEST);
        }

        // Check for suspicious patterns
        if (/^(.)\1{9,}$/.test(cleanPhone)) { // All same digits
            throw new AppError("Nomor telepon tidak valid", HttpStatus.BAD_REQUEST);
        }

        if (/0{5,}|1{5,}|2{5,}|3{5,}|4{5,}|5{5,}|6{5,}|7{5,}|8{5,}|9{5,}/.test(cleanPhone)) {
            throw new AppError("Nomor telepon mengandung pola yang tidak valid", HttpStatus.BAD_REQUEST);
        }

        // Store cleaned phone back
        req.body.guestCustomer.phone = cleanPhone;
    }

    next();
};

/**
 * Validate business hours for orders
 * - Allow orders outside operating hours as long as the outlet is open that day
 * - Block orders on days when the outlet is closed (isOpen = false)
 */
export const validateBusinessHours = async (req: Request, res: Response, next: NextFunction) => {
    const { outletId } = req.body;

    if (!outletId) {
        throw new AppError("Outlet ID diperlukan", HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    const operatingHours = await OperatingHoursRepository.findByOutletId(outletId);

    // If no operating hours configured, allow the order
    if (!operatingHours || operatingHours.length === 0) {
        return next();
    }

    const todaySchedule = operatingHours.find(oh => oh.dayOfWeek === currentDay);

    // If no schedule for today or outlet is closed today, reject
    if (!todaySchedule || !todaySchedule.isOpen) {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        // Find next open day
        const nextOpenDay = operatingHours
            .filter(oh => oh.isOpen)
            .sort((a, b) => {
                const dayA = a.dayOfWeek <= currentDay ? a.dayOfWeek + 7 : a.dayOfWeek;
                const dayB = b.dayOfWeek <= currentDay ? b.dayOfWeek + 7 : b.dayOfWeek;
                return dayA - dayB;
            })[0];

        const nextOpenInfo = nextOpenDay
            ? ` Outlet buka kembali hari ${dayNames[nextOpenDay.dayOfWeek]}.`
            : '';

        throw new AppError(
            `Outlet tutup pada hari ${dayNames[currentDay]}.${nextOpenInfo}`,
            HttpStatus.BAD_REQUEST
        );
    }

    // Store operating hours in request for later use (e.g. response)
    (req as any).outletOperatingHours = todaySchedule;

    next();
};

/**
 * Validate order frequency from same phone number
 */
export const validateOrderFrequency = async (req: Request, res: Response, next: NextFunction) => {
    const { guestCustomer } = req.body;
    const { phone } = guestCustomer;

    try {
        // const { db } = await import('/config/prisma');

        // Check orders from same phone in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const recentOrders = await db.order.count({
            where: {
                guestCustomer: {
                    phone: phone
                },
                createdAt: {
                    gte: oneHourAgo
                }
            }
        });

        // Maximum 3 orders per hour from same phone
        if (recentOrders >= 3) {
            throw new AppError(
                "Terlalu banyak pesanan dari nomor ini dalam 1 jam terakhir. Silakan coba lagi nanti.",
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        next();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        next(); // Continue if DB check fails
    }
};
