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
import { apiClient } from '@/lib/apis/base';

interface SystemHealthResponse {
    health: {
        status: string;
        uptime: number;
        memory: { used: number; total: number; percentage: number };
        cpu: { usage: number };
        database: { status: string; responseTime: number };
        timestamp: string;
    };
    metrics: {
        totalUsers: number;
        totalBusinesses: number;
        totalOrders: number;
        todayOrders: number;
        activeConnections: number;
    };
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
    const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            const response = await apiClient.get(`/admin/system/health`);
            if (response.status !== 200) throw new Error('Failed to fetch system health');
            return response.data;
        },
        refetchInterval: 30000,
    });

    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['system-logs'],
        queryFn: async () => {
            const response = await apiClient.get(`/admin/system/logs`);
            if (response.status !== 200) throw new Error('Failed to fetch system logs');
            return response.data;
        },
    });

    const sysData = healthData?.data as SystemHealthResponse;
    const health = sysData?.health;
    const metrics = sysData?.metrics;
    const logs = logsData?.data?.logs || [];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-emerald-600" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-600" />;
            case 'unhealthy':
                return <AlertTriangle className="w-5 h-5 text-destructive" />;
            default:
                return <Activity className="w-5 h-5 text-muted-foreground" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy':
                return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">Healthy</Badge>;
            case 'warning':
                return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Warning</Badge>;
            case 'unhealthy':
                return <Badge variant="destructive">Unhealthy</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getLogLevelBadge = (level: string) => {
        switch (level) {
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'warning':
                return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Warning</Badge>;
            case 'info':
                return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Info</Badge>;
            default:
                return <Badge variant="secondary">{level}</Badge>;
        }
    };

    const formatUptime = (uptimeSeconds: number) => {
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
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
            status: health?.database?.status === 'connected' ? 'healthy' : 'unhealthy',
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
            status: (health?.cpu?.usage || 0) < 80 ? 'healthy' : 'warning',
            icon: <Cpu className="w-5 h-5" />,
            description: `${health?.cpu?.usage || 0}% current utilization`
        },
        {
            name: 'Memory',
            status: (health?.memory?.percentage || 0) < 85 ? 'healthy' : 'warning',
            icon: <HardDrive className="w-5 h-5" />,
            description: `${health?.memory?.percentage || 0}% used (${health?.memory?.used || 0}MB/${health?.memory?.total || 0}MB)`
        },
        {
            name: 'Network',
            status: 'healthy',
            icon: <Wifi className="w-5 h-5" />,
            description: 'Network connectivity'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">System Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Monitor system health and performance</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => refetchHealth()} className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button className="flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
                        {healthLoading ? (
                            <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
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
                            {healthLoading ? '...' : formatUptime(health?.uptime || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Since last restart</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthLoading ? '...' : metrics?.totalUsers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Registered users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthLoading ? '...' : metrics?.todayOrders || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Orders placed today</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Components</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {systemComponents.map((component, index) => (
                            <div key={index} className="flex items-center space-x-3 p-4 border border-border rounded-lg">
                                <div className={`p-2 rounded-full ${component.status === 'healthy' ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                                    {component.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{component.name}</p>
                                    <p className="text-sm text-muted-foreground">{component.description}</p>
                                    <div className="mt-1">
                                        {getStatusBadge(component.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent System Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {logsLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="space-y-4">
                            {logs.map((log: SystemLog) => (
                                <div key={log.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                    <div className="flex-shrink-0">
                                        {getLogLevelBadge(log.level)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{log.action}</p>
                                        <p className="text-sm text-muted-foreground">{log.details}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatTimestamp(log.timestamp)} • Admin ID: {log.adminId}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No system logs available</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                System logs will appear here when actions are performed
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

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
