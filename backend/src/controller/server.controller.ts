import { Request, Response } from 'express'
import { monitorService } from '../service/server-monitor.service';

export class ServerMonitorController {
    public getServerStatusStream = async (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Cache-Control', 'no-transform');

        res.flushHeaders?.();

        // Initial ping
        res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

        const intervalId = setInterval(async () => {
            try {
                const payload = await monitorService.getSystemMetrics();

                res.write(`data: ${JSON.stringify(payload)}\n\n`);
            } catch (err) {
                console.error('SSE stream error:', err);
            }
        }, 1000);

        req.on('close', () => {
            clearInterval(intervalId);
            res.end();
        });
    };
}
