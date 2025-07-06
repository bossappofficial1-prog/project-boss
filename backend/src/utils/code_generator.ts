import { createHash } from 'crypto';

interface CodeConfig {
    prefix?: string;
    suffix?: string;
    dateFormat?: 'YYYYMMDD' | 'YYMMDD' | 'MMDDYY' | 'DDMMYY';
    randomLength?: number;
    separator?: string;
    includeTime?: boolean;
    upperCase?: boolean;
}

interface OutletConfig {
    name: string;
    code?: string;
    maxLength?: number;
}

/**
 * Generate outlet code from outlet name
 */
const generateOutletCode = (outletName: string, maxLength: number = 3): string => {
    if (!outletName || outletName.trim() === '') {
        throw new Error('Outlet name cannot be empty');
    }

    const cleanName = outletName.trim().toUpperCase();
    const words = cleanName.split(/\s+/);

    let code = '';

    if (words.length === 1) {
        // Single word: take first N characters
        code = words[0].substring(0, maxLength);
    } else {
        // Multiple words: take first letter of each word
        code = words.map(word => word.charAt(0)).join('');

        // If still too long, truncate
        if (code.length > maxLength) {
            code = code.substring(0, maxLength);
        }

        // If too short, add characters from first word
        if (code.length < maxLength && words[0].length > 1) {
            const remaining = maxLength - code.length;
            const firstWord = words[0];
            const additionalChars = firstWord.substring(1, 1 + remaining);
            code = code.charAt(0) + additionalChars + code.substring(1);
        }
    }

    // Ensure minimum length of 2
    if (code.length < 2) {
        code = code.padEnd(2, 'X');
    }

    return code;
};

/**
 * Generate date string based on format
 */
const generateDateString = (date: Date, format: string): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
        case 'YYYYMMDD':
            return `${year}${month}${day}`;
        case 'YYMMDD':
            return `${String(year).slice(-2)}${month}${day}`;
        case 'MMDDYY':
            return `${month}${day}${String(year).slice(-2)}`;
        case 'DDMMYY':
            return `${day}${month}${String(year).slice(-2)}`;
        default:
            return `${String(year).slice(-2)}${month}${day}`;
    }
};

/**
 * Generate time string
 */
const generateTimeString = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}${minutes}${seconds}`;
};

/**
 * Generate random string
 */
const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate random number string
 */
const generateRandomNumber = (length: number): string => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate sequential number with padding
 */
const generateSequential = (counter: number, padding: number = 4): string => {
    return String(counter).padStart(padding, '0');
};

/**
 * Generate transaction code
 */
export const generateTransactionCode = (
    outlet: OutletConfig,
    config: CodeConfig = {},
    counter?: number
): string => {
    const {
        prefix = 'TXN',
        suffix = '',
        dateFormat = 'YYMMDD',
        randomLength = 4,
        separator = '-',
        includeTime = false,
        upperCase = true
    } = config;

    const now = new Date();
    const outletCode = outlet.code || generateOutletCode(outlet.name, outlet.maxLength);
    const dateString = generateDateString(now, dateFormat);
    const timeString = includeTime ? generateTimeString(now) : '';

    let parts: string[] = [];

    // Add prefix
    if (prefix) parts.push(prefix);

    // Add outlet code
    parts.push(outletCode);

    // Add date
    parts.push(dateString);

    // Add time if requested
    if (includeTime && timeString) parts.push(timeString);

    // Add counter or random
    if (counter !== undefined) {
        parts.push(generateSequential(counter));
    } else {
        parts.push(generateRandomString(randomLength));
    }

    // Add suffix
    if (suffix) parts.push(suffix);

    let code = parts.join(separator);

    return upperCase ? code.toUpperCase() : code;
};

/**
 * Generate order code
 */
export const generateOrderCode = (
    outlet: OutletConfig,
    config: CodeConfig = {},
    counter?: number
): string => {
    const defaultConfig: CodeConfig = {
        prefix: 'ORD',
        dateFormat: 'YYMMDD',
        randomLength: 3,
        separator: '-',
        ...config
    };

    return generateTransactionCode(outlet, defaultConfig, counter);
};

/**
 * Generate invoice code
 */
export const generateInvoiceCode = (
    outlet: OutletConfig,
    config: CodeConfig = {},
    counter?: number
): string => {
    const defaultConfig: CodeConfig = {
        prefix: 'INV',
        dateFormat: 'YYYYMMDD',
        randomLength: 4,
        separator: '/',
        ...config
    };

    return generateTransactionCode(outlet, defaultConfig, counter);
};

/**
 * Generate payment code
 */
export const generatePaymentCode = (
    outlet: OutletConfig,
    config: CodeConfig = {},
    counter?: number
): string => {
    const defaultConfig: CodeConfig = {
        prefix: 'PAY',
        dateFormat: 'YYMMDD',
        randomLength: 6,
        separator: '',
        ...config
    };

    return generateTransactionCode(outlet, defaultConfig, counter);
};

/**
 * Generate receipt code
 */
export const generateReceiptCode = (
    outlet: OutletConfig,
    config: CodeConfig = {},
    counter?: number
): string => {
    const defaultConfig: CodeConfig = {
        prefix: 'RCP',
        dateFormat: 'DDMMYY',
        randomLength: 3,
        separator: '-',
        includeTime: true,
        ...config
    };

    return generateTransactionCode(outlet, defaultConfig, counter);
};

/**
 * Generate unique code with hash
 */
export const generateUniqueCode = (
    outlet: OutletConfig,
    additionalData: string = '',
    length: number = 8
): string => {
    const timestamp = Date.now().toString();
    const outletCode = outlet.code || generateOutletCode(outlet.name);
    const dataToHash = `${outletCode}-${timestamp}-${additionalData}`;

    const hash = createHash('sha256').update(dataToHash).digest('hex');
    return hash.substring(0, length).toUpperCase();
};

/**
 * Validate generated code format
 */
export const validateCodeFormat = (code: string, expectedParts: number): boolean => {
    if (!code || typeof code !== 'string') return false;

    const parts = code.split('-');
    return parts.length === expectedParts && parts.every(part => part.length > 0);
};

/**
 * Parse generated code to extract information
 */
export const parseTransactionCode = (code: string, separator: string = '-'): {
    prefix?: string;
    outletCode?: string;
    date?: string;
    time?: string;
    sequence?: string;
    suffix?: string;
} => {
    const parts = code.split(separator);

    if (parts.length < 4) {
        throw new Error('Invalid code format');
    }

    return {
        prefix: parts[0],
        outletCode: parts[1],
        date: parts[2],
        time: parts.length > 5 ? parts[3] : undefined,
        sequence: parts[parts.length - 1],
        suffix: parts.length > 4 && !parts[3].match(/^\d{6}$/) ? parts[parts.length - 1] : undefined
    };
};

/**
 * Batch generate codes
 */
export const generateBatchCodes = (
    outlet: OutletConfig,
    type: 'transaction' | 'order' | 'invoice' | 'payment' | 'receipt',
    count: number,
    config: CodeConfig = {}
): string[] => {
    const codes: string[] = [];

    for (let i = 1; i <= count; i++) {
        let code: string;

        switch (type) {
            case 'transaction':
                code = generateTransactionCode(outlet, config, i);
                break;
            case 'order':
                code = generateOrderCode(outlet, config, i);
                break;
            case 'invoice':
                code = generateInvoiceCode(outlet, config, i);
                break;
            case 'payment':
                code = generatePaymentCode(outlet, config, i);
                break;
            case 'receipt':
                code = generateReceiptCode(outlet, config, i);
                break;
            default:
                throw new Error('Invalid code type');
        }

        codes.push(code);
    }

    return codes;
};

// Export utility functions
export {
    generateOutletCode,
    generateDateString,
    generateTimeString,
    generateRandomString,
    generateRandomNumber,
    generateSequential
};