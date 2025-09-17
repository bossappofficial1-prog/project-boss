import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Cpu, HardDrive, Database, Clock } from "lucide-react";
import { SystemHealth } from "@/lib/types/api.types";

interface SystemHealthCardProps {
    health: SystemHealth | null;
    isLoading: boolean;
}

export function SystemHealthCard({ health, isLoading }: SystemHealthCardProps) {

    const formatUptime = (uptime: number) => {
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days}d ${remainingHours}h`;
        }
        return `${hours}h ${minutes}m`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy':
                return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Healthy</Badge>;
            case 'warning':
                return <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Warning</Badge>;
            case 'unhealthy':
                return <Badge variant="default" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Unhealthy</Badge>;
            case 'unknown':
                return <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">Unknown</Badge>;
            default:
                return <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">Unknown</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-1">
                    {isLoading ? (
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-20 rounded"></div>
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {getStatusBadge(health?.status || 'unknown')}
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-0">
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">System Health Details</span>
                                        </div>

                                        <div className="space-y-3">
                                            {/* CPU Usage */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Cpu className="h-3 w-3 text-blue-500" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">CPU</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.min(health?.cpu?.usage || 0, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 min-w-[3rem] text-right">
                                                        {health?.cpu?.usage?.toFixed(1) || 'N/A'}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Memory Usage */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <HardDrive className="h-3 w-3 text-purple-500" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.min(health?.memory?.percentage || 0, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 min-w-[3rem] text-right">
                                                        {health?.memory?.percentage?.toFixed(1) || 'N/A'}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Database Status */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-3 w-3 text-green-500" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                                                </div>
                                                <span className={`text-sm font-medium ${health?.database?.status === 'connected'
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {health?.database?.status === 'connected' ? 'Connected' : 'Disconnected'}
                                                </span>
                                            </div>

                                            {/* Uptime */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3 text-orange-500" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                                                </div>
                                                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                                    {health?.uptime ? formatUptime(health.uptime) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer with last updated time */}
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                                                Last updated: {new Date().toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {health?.status === 'healthy' ? 'All systems operational' :
                        health?.status === 'warning' ? 'Minor issues detected' :
                            health?.status === 'unhealthy' ? 'System issues found' :
                                'Status unknown'}
                </p>
            </CardContent>
        </Card>
    );
}