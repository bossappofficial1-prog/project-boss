
import { createServer, Server as HttpServer } from "http"
import { Server } from "socket.io"
import { config } from ".";
import { Express } from "express";

let io: Server;

export const initSocket = (app: Express) => {
    const server = createServer(app)
    io = new Server(server, {
        cors: {
            origin: config.CLIENT_URL,
            methods: ["GET", "POST"]
        }
    })

    io.on("connection", (socket) => {
        console.log(`🔥 Client connected: ${socket.id}`)

        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        })

        socket.on("join", (roomName) => {
            console.log(`User join to room: ${roomName}`);
            socket.join(roomName)
            console.log(`👉 ${socket.id} join room ${roomName}`);
            console.log("📌 List room socket:", socket.rooms);
        })
    })

    return server
}

export const getIO = () => {
    if (!io) throw new Error("Socket.io belum diinisialisasi");

    return io
}