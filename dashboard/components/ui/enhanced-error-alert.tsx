'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
    error: {
        message: string;
        code?: string;
        details?: string;
    };
    onRetry?: () => void;
    onDismiss?: () => void;
    title?: string;
    variant?: 'default' | 'destructive';
    className?: string;
    showDetails?: boolean;
    retryText?: string;
    isRetrying?: boolean;
}

export function ErrorAlert({
    error,
    onRetry,
    onDismiss,
    title = 'Error',
    variant = 'destructive',
    className,
    showDetails = false,
    retryText = 'Try Again',
    isRetrying = false,
}: ErrorAlertProps) {
    const [showFullDetails, setShowFullDetails] = useState(false);

    return (
        <Alert variant={variant} className={cn('relative', className)}>
            <AlertCircle className="h-4 w-4" />
            <div className="flex-1">
                <AlertTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDismiss}
                            className="h-6 w-6 p-0 hover:bg-transparent"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </AlertTitle>
                <AlertDescription className="mt-2">
                    <div className="space-y-2">
                        <p>{error.message}</p>

                        {error.code && (
                            <p className="text-xs opacity-75">
                                Error Code: {error.code}
                            </p>
                        )}

                        {showDetails && error.details && (
                            <div className="mt-2">
                                <button
                                    onClick={() => setShowFullDetails(!showFullDetails)}
                                    className="text-xs underline opacity-75 hover:opacity-100"
                                >
                                    {showFullDetails ? 'Hide' : 'Show'} Details
                                </button>
                                {showFullDetails && (
                                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-32 overflow-auto">
                                        {error.details}
                                    </pre>
                                )}
                            </div>
                        )}

                        {onRetry && (
                            <div className="flex gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRetry}
                                    disabled={isRetrying}
                                    className="h-8"
                                >
                                    <RefreshCw className={cn('h-3 w-3 mr-1', isRetrying && 'animate-spin')} />
                                    {retryText}
                                </Button>
                            </div>
                        )}
                    </div>
                </AlertDescription>
            </div>
        </Alert>
    );
}

// Specific error components for common scenarios
export function NetworkErrorAlert({ onRetry, isRetrying }: { onRetry?: () => void; isRetrying?: boolean }) {
    return (
        <ErrorAlert
            error={{
                message: 'Unable to connect to the server. Please check your internet connection.',
                code: 'NETWORK_ERROR'
            }}
            title="Connection Error"
            onRetry={onRetry}
            isRetrying={isRetrying}
            retryText="Reconnect"
        />
    );
}

export function DataLoadErrorAlert({
    dataType,
    onRetry,
    isRetrying
}: {
    dataType: string;
    onRetry?: () => void;
    isRetrying?: boolean;
}) {
    return (
        <ErrorAlert
            error={{
                message: `Failed to load ${dataType}. This might be a temporary issue.`,
                code: 'DATA_LOAD_ERROR'
            }}
            title={`${dataType} Load Error`}
            onRetry={onRetry}
            isRetrying={isRetrying}
            retryText="Reload Data"
        />
    );
}

export function PermissionErrorAlert() {
    return (
        <ErrorAlert
            error={{
                message: 'You do not have permission to access this data.',
                code: 'PERMISSION_DENIED'
            }}
            title="Access Denied"
            variant="destructive"
        />
    );
}