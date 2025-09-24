import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorAlertProps } from "@/lib/types/api.types";

export function ErrorAlert({ error, onRetry, title = "Error Loading Data" }: ErrorAlertProps) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">{title}</h3>
                        <p className="text-sm text-red-600 mt-1">
                            {error.message || 'An unexpected error occurred'}
                        </p>
                    </div>
                </div>
                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                )}
            </div>
        </div>
    );
}