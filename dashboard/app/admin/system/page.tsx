'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Server,
    Database,
    Cpu,
    HardDrive,
    Wifi,
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    Settings,
    Shield
} from 'lucide-react';

interface SystemHealth {
    database: string;
    status: string;
    metrics: {
        totalUsers: number;
        totalBusinesses: number;
        totalOrders: number;
        pendingOrders: number;
        systemUptime: number;
    };
    timestamp: string;
}

interface SystemLog {
    id: string;
    action: string;
    adminId: string;
    details: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error';
}

export default function AdminSystem() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

    // Fetch system health
    const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/system/health`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch system health');
            return response.json();
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Fetch system logs
    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['system-logs'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/system/logs`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch system logs');
            return response.json();
        },
    });

    const health = healthData?.data as SystemHealth;
    const logs = logsData?.data?.logs || [];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'unhealthy':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default:
                return <Activity className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy':
                return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
            case 'warning':
                return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
            case 'unhealthy':
                return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getLogLevelBadge = (level: string) => {
        switch (level) {
            case 'error':
                return <Badge className="bg-red-100 text-red-800">Error</Badge>;
            case 'warning':
                return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
            case 'info':
                return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
            default:
                return <Badge variant="secondary">{level}</Badge>;
        }
    };

    const formatUptime = (uptime: number) => {
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const systemComponents = [
        {
            name: 'Database',
            status: health?.database === 'healthy' ? 'healthy' : 'unhealthy',
            icon: <Database className="w-5 h-5" />,
            description: 'PostgreSQL connection status'
        },
        {
            name: 'API Server',
            status: health?.status || 'unknown',
            icon: <Server className="w-5 h-5" />,
            description: 'Express.js server status'
        },
        {
            name: 'CPU Usage',
            status: 'healthy', // This would come from actual monitoring
            icon: <Cpu className="w-5 h-5" />,
            description: 'Current CPU utilization'
        },
        {
            name: 'Memory',
            status: 'healthy', // This would come from actual monitoring
            icon: <HardDrive className="w-5 h-5" />,
            description: 'Memory usage status'
        },
        {
            name: 'Network',
            status: 'healthy', // This would come from actual monitoring
            icon: <Wifi className="w-5 h-5" />,
            description: 'Network connectivity'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
                    <p className="text-gray-600 mt-1">Monitor system health and performance</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => refetchHealth()}
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button className="flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </Button>
                </div>
            </div>

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
                        {healthLoading ? (
                            <Activity className="h-4 w-4 text-gray-400 animate-pulse" />
                        ) : (
                            getStatusIcon(health?.status || 'unknown')
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthLoading ? '...' : getStatusBadge(health?.status || 'unknown')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {health ? formatTimestamp(health.timestamp) : 'Never'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthLoading ? '...' : formatUptime(health?.metrics?.systemUptime || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Since last restart
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthLoading ? '...' : health?.metrics?.totalUsers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Registered users
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthLoading ? '...' : health?.metrics?.pendingOrders || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Require attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* System Components */}
            <Card>
                <CardHeader>
                    <CardTitle>System Components</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {systemComponents.map((component, index) => (
                            <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                                <div className={`p-2 rounded-full ${component.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {component.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{component.name}</p>
                                    <p className="text-sm text-gray-600">{component.description}</p>
                                    <div className="mt-1">
                                        {getStatusBadge(component.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* System Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent System Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {logsLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="space-y-4">
                            {logs.map((log: SystemLog) => (
                                <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        {getLogLevelBadge(log.level)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                        <p className="text-sm text-gray-600">{log.details}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTimestamp(log.timestamp)} • Admin ID: {log.adminId}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No system logs available</p>
                            <p className="text-sm text-gray-500 mt-1">
                                System logs will appear here when actions are performed
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <RefreshCw className="w-6 h-6" />
                            <span className="text-sm">Restart Services</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <Database className="w-6 h-6" />
                            <span className="text-sm">Database Backup</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <Shield className="w-6 h-6" />
                            <span className="text-sm">Security Scan</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <Settings className="w-6 h-6" />
                            <span className="text-sm">System Config</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}