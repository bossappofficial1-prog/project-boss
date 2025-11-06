import { ServerOptions } from "socket.io";
import { config } from ".";

export const socketConfigOption: Partial<ServerOptions> = {
    cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 25000
}