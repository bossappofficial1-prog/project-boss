import { networkInterfaces } from "node:os";
import app from "./app";
import { config } from "./config";
import { initSocket } from "./config/socket";
import { connectRabbitMQ } from "./config/rabbitmq";

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
        // 1. Hubungkan ke RabbitMQ terlebih dahulu dan tunggu sampai selesai.
        await connectRabbitMQ();

        const server = initSocket(app);

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
                console.warn(`Port ${port} in use, trying ${port + 1}…`);
                startServer(port + 1);
            } else {
                console.error("Server error:", err);
            }
        });

    } catch (error) {
        console.error("🔴 Failed to start server:", error);
        // Jika koneksi awal ke RabbitMQ gagal, proses akan keluar
        // Ini lebih baik daripada menjalankan server dalam keadaan tidak stabil
        process.exit(1);
    }
}

startServer(config.PORT);
