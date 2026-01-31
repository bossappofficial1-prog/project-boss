'use client'

import React, { useState, useEffect, useRef } from 'react';
import {
    Server,
    Database,
    Activity,
    HardDrive,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    Cpu,
    Globe,
    Shield,
    Zap,
    Trash2,
    Power,
    ArrowUpRight,
    Wifi
} from "lucide-react";
import LiveServerLogs from '@/components/ui/terminal';
import { connectServerStatusStream, triggerTestTraffic } from '@/lib/services/server.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';

interface Service {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: string;
    latency: string;
    icon?: any;
}

interface Metrics {
    cpu: number;
    ramPercentage: number;
    ramUsed: string;
    storagePercentage: number;
    networkThroughput: string;
}

export default function ServerStatus() {
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const logsContainerRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const [logs, setLogs] = useState<string[]>([
        `${new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':')} [SYSTEM] Menghubungkan ke Real Server Monitor...`,
    ]);

    const [metrics, setMetrics] = useState<Metrics>({
        cpu: 0,
        ramPercentage: 0,
        ramUsed: "0",
        storagePercentage: 0,
        networkThroughput: "0"
    });

    useEffect(() => {
        if (!metrics) return;
        document.title = `C${metrics.cpu}% R${metrics.ramPercentage}% T${metrics.networkThroughput}req/s`
    }, [metrics, metrics?.cpu])

    const [servicesData, setServicesData] = useState<Service[]>([
        { name: 'API Gateway (Express)', status: 'operational', uptime: '-', latency: '-', icon: Globe },
        { name: 'PostgreSQL Database', status: 'operational', uptime: '-', latency: '-', icon: Database },
        { name: 'File Storage', status: 'operational', uptime: '-', latency: '-', icon: HardDrive },
    ]);

    useEffect(() => {
        if (eventSourceRef.current) return;

        const eventSource = new EventSource(connectServerStatusStream());
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('SSE connected');
            setIsConnected(true);
            setLogs(prev => [...prev, `${new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':')} [SYSTEM] Terhubung ke Live Stream.`].slice(-50));
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setLastUpdated(new Date(data.timestamp));
            setMetrics(data.metrics);
            setLogs(data.recentLogs);

            // Update Services
            setServicesData(prev => {
                if (!data.services) return []
                return data.services.map((newItem: Service, index: number) => ({
                    ...newItem,
                    icon: prev[index]?.icon || Globe
                }));
            });
        };

        eventSource.onerror = (err) => {
            console.error("SSE Error:", err);
            if (isConnected) {
                setLogs(prev => [...prev, `${new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':')} [ERROR] Koneksi terputus. Mencoba reconnect...`].slice(-50));
            }
            setIsConnected(false);
        };

        return () => {
            eventSourceRef.current = null;
            eventSource.close();
        };
    }, []);

    // Auto Scroll Logs
    useEffect(() => {
        if (logsContainerRef.current) {
            const { scrollHeight, clientHeight } = logsContainerRef.current;
            logsContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: "smooth"
            });
        }
    }, [logs]);

    // Fungsi Test Traffic untuk memicu perubahan data di Dashboard
    const triggerTestTrafficHandler = async () => {
        try {
            await triggerTestTraffic();
        } catch (e) {
            console.error("Failed to trigger traffic");
        }
    };

    return (
        <div className="min-h-screen font-sans text-foreground">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 ">
                        <Activity className="h-7 w-7 text-indigo-600" />
                        Live Server Monitor
                        {isConnected ? (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        ) : (
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 animate-pulse"></span>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Monitoring Data Asli dari Server Lokal (CPU, RAM, Traffic).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground flex items-center bg-card px-3 py-1.5 rounded-full shadow-sm">
                        <Clock className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* TOP METRICS (CPU/RAM/DISK/NETWORK) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* CPU */}
                <Card className="p-5 relative overflow-hidden group ">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                                CPU Usage
                            </p>
                            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                                {metrics?.cpu ?? ''}%
                            </div>
                        </div>

                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Cpu className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full mt-4 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
                            style={{ width: `${metrics?.cpu}%` }}
                        />
                    </div>
                </Card>


                {/* RAM */}
                <Card className="p-5 relative overflow-hidden group ">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                RAM Usage
                            </p>
                            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                                {metrics?.ramUsed} GB
                            </div>
                        </div>

                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <Server className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full mt-4 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                            style={{ width: `${metrics?.ramPercentage}%` }}
                        />
                    </div>
                </Card>


                {/* NETWORK / TRAFFIC */}
                <Card className="p-5 relative overflow-hidden group ">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Traffic
                            </p>
                            <div className="text-2xl font-bold mt-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                                {metrics?.networkThroughput} req/s
                            </div>
                        </div>

                        <div className="p-2 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 group-hover:scale-110 transition-transform">
                            <Wifi className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full mt-4 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full bg-teal-500 transition-all duration-500 ease-out"
                            style={{
                                width: `${Math.min((Number(metrics?.networkThroughput) / 50) * 100, 100)}%`
                            }}
                        />
                    </div>
                </Card>


                {/* STORAGE (Static/Mocked for now due to OS limitation) */}
                <Card className="p-5 relative overflow-hidden  opacity-70">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Storage
                            </p>
                            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                                N/A
                            </div>
                        </div>

                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                            <HardDrive className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full mt-4 bg-slate-100 dark:bg-slate-800" />
                    <p className="text-[10px] text-slate-400 mt-1">
                        Not available in browser environment
                    </p>
                </Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">

                {/* LEFT COLUMN: ACTIONS & SERVICES */}
                <div className="lg:col-span-3 space-y-6">

                    {/* QUICK ACTIONS */}
                    <Card className="p-5">
                        <h3 className="font-semibold  text-foreground mb-4 flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                            Test Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button
                                variant={'outline'}
                                onClick={() => triggerTestTrafficHandler()}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all text-sm font-medium "
                            >
                                <RefreshCw className="h-4 w-4" />
                                Send Test Request
                            </Button>
                            <Button
                                variant={'outline'}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all text-sm font-medium">
                                <Trash2 className="h-4 w-4" />
                                Clear Client Logs
                            </Button>
                            <Button
                                variant={'outline'}
                                onClick={() => setMaintenanceMode(!maintenanceMode)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all text-sm font-medium ${maintenanceMode
                                    ? 'border-red-200 text-red-700'
                                    : 'border-slate-200'
                                    }`}
                            >
                                <Power className="h-4 w-4" />
                                {maintenanceMode ? 'Exit Maintenance' : 'Maintenance Mode'}
                            </Button>
                        </div>
                    </Card>

                    {/* SERVICE HEALTH */}
                    <Card className="overflow-hidden gap-0 py-0">
                        <div className="p-4 border-b border-muted flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <h3 className="font-semibold text-foreground">Service Dependencies</h3>
                            </div>
                            {isConnected ? (
                                <Badge variant="success">Monitoring Active</Badge>
                            ) : (
                                <Badge variant="destructive" className="animate-pulse">Disconnected</Badge>
                            )}
                        </div>
                        <div className="divide-y divide-muted">
                            {servicesData.map((service, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 ${service.status === 'operational' ? 'bg-white text-slate-600' : 'bg-orange-50 text-orange-600'}`}>
                                            <service.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{service.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="font-mono">UP: {formatDuration(Number(service.uptime.replace('s', '')))}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="font-mono">LAT: {service.latency}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {service.status === 'operational' ? (
                                            <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1 rounded">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                <span>OK</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider bg-orange-50 px-2 py-1 rounded">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>Degraded</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: TERMINAL LOGS */}
                <div className="lg:col-span-3 h-full">
                    <LiveServerLogs
                        logs={logs}
                        isConnected={isConnected}
                    />
                </div>

            </div>
        </div>
    );
}