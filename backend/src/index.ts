import { networkInterfaces } from "node:os";
import app from "./app";
import { config } from "./config";
import { connectRabbitMQ, onRabbitMQConnect } from "./config/rabbitmq";
import http from "node:http"
import { SocketEmitter } from "./socket/socket-emiiter";
import { Server } from "socket.io";
import { socketConfigOption } from "./config/socket";
import { initSocket } from "./socket";
import { setUpJobs } from "./jobs";
import { bootstrapQueues } from "./bootstrap/queue.bootstrap";
import { IntegrationService } from "./service/integration.service";
import { workerManager } from "./workers/worker-manager";
import { initializeElasticsearch } from "./service/elastic.service";


function getNetworkAdresses(): string[] {
    const nets = networkInterfaces();
    const results: string[] = []

    for (const name of Object.keys(nets)) {
        const netsInterface = nets[name]!;
        for (const net of netsInterface) {
            if (net.family === "IPv4" && !net.internal) {
                results.push(net.address)
            }
        }
    }
    return results
}

async function startServer(port: number) {
    try {
        const server = http.createServer(app)
        // socketUtils.init(server)

        const io = new Server(server, socketConfigOption)
        initSocket(io)
        SocketEmitter.getInstance().init(io)
        await bootstrapQueues();

        setUpJobs();

        // Initialize Elasticsearch
        await initializeElasticsearch();

        const rabbitMQConnected = await connectRabbitMQ();

        // Start workers immediately if connected, or defer to onConnect callback
        if (rabbitMQConnected) {
            await workerManager.startAll();
        } else {
            console.warn('⚠ RabbitMQ not available, workers will start when RabbitMQ connects.');
        }

        // Handle late/reconnecting RabbitMQ — start workers when connection becomes available
        onRabbitMQConnect(async () => {
            if (!workerManager.started) {
                try {
                    await workerManager.startAll();
                } catch (err) {
                    console.error('Failed to start workers on RabbitMQ reconnect:', err);
                }
            }
        });

        // Hubungkan ulang sesi WhatsApp aktif
        await IntegrationService.initializeAllSessions();

        server.requestTimeout = 30 * 60 * 1000; // 30 menit
        server.headersTimeout = 30 * 60 * 1000;
        server.keepAliveTimeout = 30 * 60 * 1000;

        server.listen(port, () => {
            console.log(`• Server running on:`);
            console.log(`   Local:   http://localhost:${port}`);

            const addrs = getNetworkAdresses();
            if (addrs.length) {
                for (const addr of addrs) {
                    console.log(`   Network: http://${addr}:${port}`);
                }
            }
        });

        server.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE") {
                console.warn(`Port ${port} in use, trying ${port + 1}...`);
                startServer(port + 1);
            } else {
                console.error("Server error:", err);
            }
        });

    } catch (error) {
        console.error("🔴 Failed to start server:", error);
        process.exit(1);
    }
}

startServer(config.PORT);
