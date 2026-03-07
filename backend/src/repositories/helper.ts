export function parseAndForceIsoUtc(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (obj instanceof Date) {
        return obj.toISOString();
    }

    if (typeof obj === 'string') {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:[-+]\d{2}:?\d{2}|Z)?$/;
        if (isoDateRegex.test(obj)) {
            const hasTimezone = /(?:[-+]\d{2}:?\d{2}|Z)$/.test(obj);
            const normalized = hasTimezone ? obj : obj + 'Z';
            return new Date(normalized).toISOString();
        }
        return obj;
    }

    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(parseAndForceIsoUtc);

    const newObj: any = {};
    for (const key in obj) {
        newObj[key] = parseAndForceIsoUtc(obj[key]);
    }
    return newObj;
}