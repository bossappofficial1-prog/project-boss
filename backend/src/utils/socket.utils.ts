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

            socket.on("business:outlet", (outletId: string) => {
                socket.join(`business_outlet_${outletId}`);
                console.log(`Socket ${socket.id} joined business:outlet ${outletId}`);
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

    async emitToBusinessOutlet(outletId: string, payload: any) {
        if (!this.io) throw new Error("Socket.io not initialized");
        this.io.to(`business_outlet_${outletId}`).emit("businessEvent", payload);
    }
}

export const socketUtils = new SocketUtils();
