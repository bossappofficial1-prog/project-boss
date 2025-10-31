"use client";

import { useSnackbar } from "@/hooks/useSnackbar";

/**
 * Demo page untuk testing Snackbar component
 * Akses: /snackbar-demo
 */
export default function SnackbarDemo() {
    const snackbar = useSnackbar();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Snackbar Demo</h1>
                    <p className="text-muted-foreground">
                        Test different snackbar notifications
                    </p>
                </div>

                {/* Basic Types */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Basic Types</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => snackbar.success("Operation completed successfully!")}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Success
                        </button>
                        <button
                            onClick={() => snackbar.error("Something went wrong!")}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Error
                        </button>
                        <button
                            onClick={() => snackbar.warning("Please be careful!")}
                            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                            Warning
                        </button>
                        <button
                            onClick={() => snackbar.info("Here's some information")}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Info
                        </button>
                    </div>
                </div>

                {/* Custom Duration */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Custom Duration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => snackbar.success("Quick message (1.5s)", 1500)}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Quick (1.5s)
                        </button>
                        <button
                            onClick={() => snackbar.info("Normal message (3s)")}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Normal (3s)
                        </button>
                        <button
                            onClick={() => snackbar.warning("Long message (5s)", 5000)}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Long (5s)
                        </button>
                    </div>
                </div>

                {/* Multiple Notifications */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Multiple Notifications</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                snackbar.info("Starting process...");
                                setTimeout(() => snackbar.success("Step 1 complete"), 1000);
                                setTimeout(() => snackbar.success("Step 2 complete"), 2000);
                                setTimeout(() => snackbar.success("All done!"), 3000);
                            }}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Sequential Notifications
                        </button>
                        <button
                            onClick={() => {
                                snackbar.success("Success notification");
                                snackbar.error("Error notification");
                                snackbar.warning("Warning notification");
                                snackbar.info("Info notification");
                            }}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Multiple at Once
                        </button>
                    </div>
                </div>

                {/* Long Messages */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Long Messages</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() =>
                                snackbar.success(
                                    "This is a longer success message to test how the snackbar handles multiple lines of text. It should wrap nicely and remain readable."
                                )
                            }
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Long Success Message
                        </button>
                        <button
                            onClick={() =>
                                snackbar.error(
                                    "An error occurred while processing your request. Please check your internet connection and try again later. If the problem persists, contact support."
                                )
                            }
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Long Error Message
                        </button>
                    </div>
                </div>

                {/* Real-world Scenarios */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Real-world Scenarios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                snackbar.info("Saving changes...", 0);
                                setTimeout(() => {
                                    snackbar.success("Changes saved successfully!");
                                }, 2000);
                            }}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Simulate Save
                        </button>
                        <button
                            onClick={() => {
                                snackbar.info("Uploading file...", 0);
                                setTimeout(() => {
                                    snackbar.success("File uploaded!");
                                }, 3000);
                            }}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Simulate Upload
                        </button>
                        <button
                            onClick={() => {
                                snackbar.success("Item added to cart!", 2000);
                            }}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Add to Cart
                        </button>
                        <button
                            onClick={() => {
                                snackbar.warning("Session will expire in 5 minutes", 5000);
                            }}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Session Warning
                        </button>
                    </div>
                </div>

                {/* Documentation Link */}
                <div className="mt-12 p-6 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                    <p className="text-muted-foreground mb-4">
                        For complete documentation and usage examples, check out the docs.
                    </p>
                    <code className="text-sm bg-background px-3 py-1 rounded">
                        docs/Snackbar-Usage.md
                    </code>
                </div>
            </div>
        </div>
    );
}
