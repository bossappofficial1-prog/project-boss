import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { RecentActivity } from "@/lib/types/api.types";
import { AllActivitiesModal } from "./all-activities-modal";

interface RecentActivityCardProps {
    activities: RecentActivity[];
    isLoading?: boolean;
}

export function RecentActivityCard({ activities, isLoading }: RecentActivityCardProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />;
            case 'warning':
                return <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />;
            default:
                return <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span>Recent Activity</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-4 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-3/4 rounded"></div>
                                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-3 w-1/2 rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    {getStatusIcon(activity.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {activity.timestamp}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4">
                    <AllActivitiesModal>
                        <Button variant="outline" size="sm" className="w-full">
                            View All Activity
                        </Button>
                    </AllActivitiesModal>
                </div>
            </CardContent>
        </Card>
    );
}