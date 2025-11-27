import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, SOCKET_EVENT } from "./types";


export const initSocket = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io.on("connection", (socket) => {
        console.log("🔌 Client connected:", socket.id);

        // JOIN ROOM
        socket.on(SOCKET_EVENT.JOIN_OUTLET, ({ outletId }) => {
            socket.join(outletId);
            console.log(`Socket ${socket.id} joined outlet ${outletId}`);
        });

        socket.on(SOCKET_EVENT.JOIN_USER, ({ userId }) => {
            socket.join(userId);
            console.log(`Socket ${socket.id} joined user ${userId}`);
        });

        // USER BAYAR
        socket.on(SOCKET_EVENT.PAYMENT_SUBMIT, ({ outletId, orderId, amount }) => {
            console.log(`💳 Pembayaran dari user diterima untuk outlet ${outletId}`);

            io.to(outletId).emit(SOCKET_EVENT.PAYMENT_NEW, {
                orderId,
                amount,
                message: "Pembayaran baru diterima",
            });
        });

        // OUTLET UPDATE STATUS
        socket.on(SOCKET_EVENT.ORDER_UPDATE_STATUS, ({ orderId, customerId, status }) => {
            console.log(`📦 Order ${orderId} update ke status ${status}`);

            io.to(customerId).emit(SOCKET_EVENT.ORDER_STATUS_CHANGED, {
                orderId,
                status,
                message: "Pesananmu sudah siap!",
            });
        });

        socket.on(SOCKET_EVENT.JOIN_ORDER_UPDATE, (orderId: string) => {
            socket.join(orderId);
            console.log(`Socket ${socket.id} joined order:update ${orderId}`);
        });

        socket.on(SOCKET_EVENT.JOIN_BUSINESS, (outletId: string) => {
            socket.join(`business_outlet_${outletId}`);
            console.log(`Socket ${socket.id} joined business:outlet ${outletId}`);
        })

        socket.on("disconnect", () => {
            console.log(`❌ Socket ${socket.id} disconnected`);
        });

    })
}