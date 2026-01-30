import os from 'os'
import { db } from '../config/prisma';

export class ServerMonitorService {
    private requestCount = 0;
    private recentLogs: string[] = [];
    private previousCpuInfo = this.getCpuTick()
    private lastThroughputCheck = Date.now();
    private lastDbCheck = 0;
    private cachedDbStatus = { status: 'operational', latency: '0ms' };

    private getCpuTick() {
        const cpus = os.cpus()
        let user = 0, nice = 0, sys = 0, idle = 0, irq = 0

        for (const cpu of cpus) {
            user += cpu.times.user;
            nice += cpu.times.nice;
            sys += cpu.times.sys;
            idle += cpu.times.idle;
            irq += cpu.times.irq;
        }

        return { idle, total: user + nice + sys + idle + irq };
    }

    private calculateCpuUsage() {
        const currentCpuInfo = this.getCpuTick();
        const idleDiff = currentCpuInfo.idle - this.previousCpuInfo.idle;
        const totalDiff = currentCpuInfo.total - this.previousCpuInfo.total;

        this.previousCpuInfo = currentCpuInfo;

        if (totalDiff <= 0) return 0;

        return Math.max(
            0,
            Math.min(100, 100 - Math.floor((idleDiff / totalDiff) * 100))
        );
    }

    private getRealMemory() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        return {
            percentage: Math.floor((usedMem / totalMem) * 100),
            usedGB: (usedMem / (1024 ** 3)).toFixed(1),
            totalGB: (totalMem / (1024 ** 3)).toFixed(1)
        };
    }


    public getThroughput() {
        const now = Date.now();
        const deltaSeconds = (now - this.lastThroughputCheck) / 1000;
        const rps = (this.requestCount / deltaSeconds).toFixed(1);

        this.requestCount = 0;
        this.lastThroughputCheck = now;

        return rps;
    }

    public incrementRequest() {
        this.requestCount++;
    }

    public addLog(message: string) {
        const time = new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');
        const logEntry = `${time} ${message}`;
        // Keep last 50 logs
        this.recentLogs.push(logEntry);
        if (this.recentLogs.length > 100) this.recentLogs.shift();
    }

    public getLastLog() {
        return this.recentLogs[this.recentLogs.length - 1] ?? '[SYSTEM] Monitoring active';
    }

    public async getSystemMetrics() {
        const dbHealth = await this.checkDbHealth();

        return {
            timestamp: new Date().toISOString(),
            metrics: {
                cpu: this.calculateCpuUsage(),
                ramPercentage: this.getRealMemory().percentage,
                ramUsed: this.getRealMemory().usedGB,
                storagePercentage: 0,
                networkThroughput: this.getThroughput()
            },
            log: this.getLastLog(),
            recentLogs: this.recentLogs,
            services: [
                {
                    name: 'API Gateway (Express)',
                    status: 'operational',
                    uptime: `${process.uptime().toFixed(0)}s`,
                    latency: '0ms'
                },
                {
                    name: 'PostgreSQL Database',
                    status: dbHealth.status,
                    latency: dbHealth.latency,
                    uptime: '-'
                },
                {
                    name: 'File Storage',
                    status: 'operational',
                    uptime: '-',
                    latency: '-'
                }
            ]
        };
    }
    private async checkDbHealth() {
        if (Date.now() - this.lastDbCheck < 5000) {
            return this.cachedDbStatus;
        }

        try {
            const start = Date.now();
            await db.$queryRaw`SELECT 1`;
            this.cachedDbStatus = {
                status: 'operational',
                latency: `${Date.now() - start}ms`
            };
        } catch {
            this.cachedDbStatus = {
                status: 'down',
                latency: '-'
            };
            this.addLog('[ERROR] Database Connection Failed');
        }

        this.lastDbCheck = Date.now();
        return this.cachedDbStatus;
    }

    public getThroughputAndReset() {
        const currentRps = (this.requestCount / 2).toFixed(1);
        this.requestCount = 0;
        return currentRps;
    }
}

export const monitorService = new ServerMonitorService()