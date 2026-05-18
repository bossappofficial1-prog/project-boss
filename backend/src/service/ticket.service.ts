import { TicketCodeStatus } from "@prisma/client";
import { TicketRepository } from "../repositories/ticket.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export class TicketService {
  static async verifyTicket(code: string) {
    const ticket = await TicketRepository.findByCode(code);

    if (!ticket) {
      throw new AppError("Kode tiket tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    return {
      id: ticket.id,
      code: ticket.code,
      status: ticket.status,
      productName: ticket.orderItem.product.name,
      eventDate: ticket.orderItem.product.ticket?.eventDate,
      eventEndDate: ticket.orderItem.product.ticket?.eventEndDate,
      venue: ticket.orderItem.product.ticket?.venue,
      venueAddress: ticket.orderItem.product.ticket?.venueAddress,
      customerName: ticket.orderItem.order.guestCustomer?.name,
      customerPhone: ticket.orderItem.order.guestCustomer?.phone,
      orderId: ticket.orderItem.order.id,
      outletId: ticket.orderItem.order.outletId,
      outletName: ticket.orderItem.order.outlet.name,
      redeemedAt: ticket.redeemedAt,
      redeemedBy: ticket.redeemedBy,
      createdAt: ticket.createdAt,
    };
  }

  static async redeemTicket(code: string, staffId: string | undefined, staffOutletId: string) {
    const ticket = await TicketRepository.findByCode(code);

    if (!ticket) {
      throw new AppError("Kode tiket tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    if (ticket.orderItem.order.outletId !== staffOutletId) {
      throw new AppError("Tiket ini bukan milik outlet Anda", HttpStatus.FORBIDDEN);
    }

    if (ticket.status === TicketCodeStatus.REDEEMED) {
      throw new AppError(
        `Tiket sudah digunakan pada ${ticket.redeemedAt?.toLocaleString("id-ID")}`,
        HttpStatus.BAD_REQUEST
      );
    }

    if (ticket.status === TicketCodeStatus.CANCELLED) {
      throw new AppError("Tiket sudah dibatalkan", HttpStatus.BAD_REQUEST);
    }

    if (ticket.status === TicketCodeStatus.EXPIRED) {
      throw new AppError("Tiket sudah kadaluarsa", HttpStatus.BAD_REQUEST);
    }

    // Check payment status
    if (ticket.orderItem.order.paymentStatus !== "SUCCESS") {
      throw new AppError("Pembayaran tiket belum dikonfirmasi", HttpStatus.BAD_REQUEST);
    }

    const redeemed = await TicketRepository.redeem(code, staffId);

    return {
      id: redeemed.id,
      code: redeemed.code,
      status: redeemed.status,
      redeemedAt: redeemed.redeemedAt,
      productName: ticket.orderItem.product.name,
      customerName: ticket.orderItem.order.guestCustomer?.name,
    };
  }

  static async getTicketsByOrderId(orderId: string) {
    return TicketRepository.findByOrderId(orderId);
  }

  static async getTicketCodesByProduct(productId: string, page = 1, limit = 50) {
    return TicketRepository.findByProductId(productId, page, limit);
  }

  static async getOrderTicketsPrintData(orderId: string) {
    const tickets = await TicketRepository.findByOrderId(orderId);
    
    return tickets.map((t) => {
      const eventDate = t.orderItem.product.ticket?.eventDate;
      
      const dateStr = eventDate 
        ? eventDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) 
        : "-";
        
      const timeStr = eventDate 
        ? eventDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) 
        : "-";

      return {
        id: t.id,
        code: t.code,
        productName: t.orderItem.product.name,
        eventDate: dateStr,
        eventTime: timeStr,
        venue: t.orderItem.product.ticket?.venue || "-",
        customerName: t.orderItem.order.guestCustomer?.name || "Customer",
        outletName: t.orderItem.order.outlet.name,
        codeFormat: t.orderItem.product.ticket?.codeFormat,
        primaryColor: (t.orderItem.product.ticket?.designConfig as any)?.primaryColor,
        layoutType: (t.orderItem.product.ticket?.designConfig as any)?.layoutType,
        isBarcode: t.orderItem.product.ticket?.codeFormat === "BARCODE_128",
        codeImageUrl: t.orderItem.product.ticket?.codeFormat === "BARCODE_128" 
          ? `https://bwipjs-api.metafloor.com/?bcid=code128&text=${t.code}&scale=3&height=10&includetext=false`
          : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.code}`,
      };
    });
  }
}
