import { useSnackbar as useSnackbarContext } from "@/context/SnackbarContext";

/**
 * Custom hook untuk menampilkan snackbar notifications
 * 
 * @example
 * ```tsx
 * const snackbar = useSnackbar();
 * 
 * // Success notification
 * snackbar.success("Data saved successfully!");
 * 
 * // Error notification
 * snackbar.error("Failed to save data");
 * 
 * // Warning notification
 * snackbar.warning("Please check your input");
 * 
 * // Info notification
 * snackbar.info("New updates available");
 * 
 * // Custom duration (default is 3000ms)
 * snackbar.success("Quick message", 1500);
 * ```
 */
export const useSnackbar = () => {
    const { showSnackbar } = useSnackbarContext();

    return {
        success: (message: string, duration?: number) =>
            showSnackbar(message, "success", duration),
        error: (message: string, duration?: number) =>
            showSnackbar(message, "error", duration),
        warning: (message: string, duration?: number) =>
            showSnackbar(message, "warning", duration),
        info: (message: string, duration?: number) =>
            showSnackbar(message, "info", duration),
        show: showSnackbar,
    };
};
