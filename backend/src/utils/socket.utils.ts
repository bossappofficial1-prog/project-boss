import { Server } from "socket.io";

class SocketUtils {
    private io: Server | null = null;

    init(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" },
        });

        this.io.on("connection", (socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on("order:update", (orderId: string) => {
                socket.join(orderId);
                console.log(`Socket ${socket.id} joined order:update ${orderId}`);
            });

            socket.on("disconnect", () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    }

    async emitToOrder(orderId: string, payload: any) {
        if (!this.io) throw new Error("Socket.io not initialized");
        this.io.to(orderId).emit("orderEvent", payload);
    }
}

export const socketUtils = new SocketUtils();
