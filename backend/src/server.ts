import { networkInterfaces } from "node:os";
import app from "./app";
import { config } from "./configs/config";

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

function startServer(port: number) {
    const server = app.listen(port, () => {
        console.log(`• Server running on:`);
        console.log(`   Local:   http://localhost:${port}`);
        console.log(`   Swagger docs di http://localhost:${port}/api/v1/docs`);

        const addrs = getNetworkAdresses();
        if (addrs.length) {
            for (const addr of addrs) {
                console.log(`   Network: http://${addr}:${port}`);
            }
        }
    })

    server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
            console.warn(`Port ${port} in use, trying ${port + 1}…`);
            startServer(port + 1)
        } else {
            console.error("Server error:", err);
        }
    })
}

startServer(config.PORT)
