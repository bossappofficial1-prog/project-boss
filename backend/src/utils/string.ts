export const StringUtil = {
    generateOTP(length: number = 6): string {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    },

    generateRandomString(length = 32): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    slugify(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "") // hapus karakter selain huruf, angka, spasi
            .replace(/\s+/g, "-") // spasi jadi -
            .replace(/-+/g, "-"); // hilangkan - berlebih
    },

    formatCurrency(
        value: number | string,
        options: {
            currency?: string;
            locale?: string;
            minimumFractionDigits?: number;
            maximumFractionDigits?: number;
        } = {}
    ): string {
        const {
            currency = 'IDR',
            locale = 'id-ID',
            minimumFractionDigits = 0,
            maximumFractionDigits = 0,
        } = options;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(value as number);
    }
};