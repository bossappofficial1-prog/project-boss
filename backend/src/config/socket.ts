import { Server } from 'socket.io';
import http from 'http';
import { Express } from 'express';

let io: Server;

export function initSocket(app: Express) {
    const server = http.createServer(app);
    io = new Server(server, {
        cors: {
            origin: "*", // Configure this properly for production
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected');
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    return server;
}

export function getSocketIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized.');
    }
    return io;
}