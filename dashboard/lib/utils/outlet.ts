/**
 * Utility functions for outlet management
 */

/**
 * Get the currently selected outlet ID from localStorage
 * @returns The outlet ID or null if not found
 */
export function getSelectedOutletId(): string | null {
    if (typeof window === 'undefined') {
        return null; // SSR
    }

    try {
        const outletId = localStorage.getItem('selectedOutlet');
        if (outletId) {
            return outletId;
        }

        // Try to migrate from old format (selectedOutletId)
        const oldOutlet = localStorage.getItem('selectedOutletId');
        if (oldOutlet) {
            try {
                // Try as JSON first
                const parsed = JSON.parse(oldOutlet);
                if (parsed && parsed.id) {
                    // Migrate to new format
                    localStorage.setItem('selectedOutlet', parsed.id);
                    localStorage.removeItem('selectedOutletId');
                    return parsed.id;
                }
            } catch {
                // Try as plain ID
                localStorage.setItem('selectedOutlet', oldOutlet);
                localStorage.removeItem('selectedOutletId');
                return oldOutlet;
            }
        }

        return null;
    } catch (error) {
        console.error('Error getting selected outlet ID:', error);
        return null;
    }
}

/**
 * Set the selected outlet ID in localStorage
 * @param outletId The outlet ID to save
 */
export function setSelectedOutletId(outletId: string): void {
    if (typeof window === 'undefined') {
        return; // SSR
    }

    try {
        localStorage.setItem('selectedOutlet', outletId);
        // Clean up old format
        localStorage.removeItem('selectedOutletId');
    } catch (error) {
        console.error('Error setting selected outlet ID:', error);
    }
}

/**
 * Clear the selected outlet from localStorage
 */
export function clearSelectedOutlet(): void {
    if (typeof window === 'undefined') {
        return; // SSR
    }

    try {
        localStorage.removeItem('selectedOutlet');
        localStorage.removeItem('selectedOutletId'); // Clean up old format too
    } catch (error) {
        console.error('Error clearing selected outlet:', error);
    }
}

/**
 * Check if an outlet ID is currently selected
 * @param outletId The outlet ID to check
 * @returns True if the outlet is selected
 */
export function isOutletSelected(outletId: string): boolean {
    return getSelectedOutletId() === outletId;
}