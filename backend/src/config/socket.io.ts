
import { createServer, Server as HttpServer } from "http"
import { Server } from "socket.io"
import { config } from ".";
import { Express } from "express";

let io: Server;

export const initSocket = (app: Express) => {
    const server = createServer(app)
    io = new Server(server, {
        cors: { origin: "*" },
    })

    io.on("connection", (socket) => {
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
    })

    return server
}

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");

    return io
}

export const emitToOrder = (orderId: string, payload: any) => {
    if (!io) throw new Error("Socket.io not initialized");
    io.to(orderId).emit("orderEvent", payload);
}

export const emitToBusinessOutlet = (outletId: string, payload: any) => {
    if (!io) throw new Error("Socket.io not initialized");
    io.to(`business_outlet_${outletId}`).emit("businessEvent", payload);
}