'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // In production, you might want to log this to an error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Example: logErrorToService(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 dark:from-gray-900 dark:via-red-900/10 dark:to-gray-900 flex items-center justify-center font-poppins">
                    <div className="text-center max-w-md mx-auto px-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-8 h-8 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none w-full sm:w-auto"
                                type="button"
                                aria-label="Refresh the page"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Refresh Page
                            </button>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-4 text-left">
                                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-40 text-red-600 dark:text-red-400">
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useErrorHandler() {
    return (error: Error, errorInfo?: ErrorInfo) => {
        console.error('Error caught by useErrorHandler:', error, errorInfo);

        if (process.env.NODE_ENV === 'production') {
            // Log to error reporting service
            // Example: logErrorToService(error, errorInfo);
        }
    };
}