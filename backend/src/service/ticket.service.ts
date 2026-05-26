import { TicketCodeStatus } from "@prisma/client";
import { TicketRepository } from "../repositories/ticket.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { EmailService } from "./email.service";

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

  static async resendTicketViaEmail(code: string) {
    const ticket = await TicketRepository.findByCode(code);

    if (!ticket) {
      throw new AppError("Kode tiket tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const email = ticket.orderItem.order.guestCustomer?.email;
    if (!email) {
      throw new AppError("Pelanggan tidak memiliki alamat email terdaftar", HttpStatus.BAD_REQUEST);
    }

    const customerName = ticket.orderItem.order.guestCustomer?.name || "Pelanggan";
    const productName = ticket.orderItem.product.name;
    const eventDate = ticket.orderItem.product.ticket?.eventDate
      ? ticket.orderItem.product.ticket.eventDate.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "-";
    const venue = ticket.orderItem.product.ticket?.venue || "-";
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}`;

    const htmlContent = `
      <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #ef4444; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.025em;">BOSS E-TICKET</h1>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1e293b;">
          <p style="font-size: 16px; margin-top: 0;">Halo <b>${customerName}</b>,</p>
          <p>Berikut adalah e-tiket Anda untuk event <b>${productName}</b>:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #ebd8d8; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Event</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: bold; text-align: right;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Tanggal</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: bold; text-align: right;">${eventDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Lokasi</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: bold; text-align: right;">${venue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Kode Tiket</td>
                <td style="padding: 6px 0; font-size: 14px; font-family: monospace; font-weight: bold; color: #ef4444; text-align: right;">${code}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;">Tunjukkan kode QR ini pada panitia registrasi masuk:</p>
            <img src="${qrImageUrl}" alt="QR Code Tiket" style="border: 1px solid #ebd8d8; border-radius: 8px; padding: 8px;" width="150" height="150" />
          </div>
          
          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
            Terima kasih telah menggunakan layanan BOSS App.<br/>Jika ada pertanyaan, silakan hubungi tim penyelenggara event.
          </p>
        </div>
      </div>
    `;

    await EmailService.sendEmail({
      to: email,
      subject: `[E-TICKET] ${productName} - ${code}`,
      text: `Halo ${customerName}, e-tiket Anda untuk ${productName} di ${venue} pada tanggal ${eventDate}. Kode tiket: ${code}. Tunjukkan kode QR di lokasi.`,
      html: htmlContent,
    });

    return { message: "Tiket berhasil dikirim ulang ke email pelanggan" };
  }

  static async exportTicketsToCSV(productId: string) {
    const codesResult = await TicketRepository.findByProductId(productId, 1, 100000);
    
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8 support
    csvContent += "Kode Tiket,Nama Pelanggan,Nomor HP,Status Tiket,Tanggal Pembuatan,Waktu Redeem\n";

    for (const ticket of codesResult.codes) {
      const code = ticket.code;
      const name = ticket.orderItem.order.guestCustomer?.name || "-";
      const phone = ticket.orderItem.order.guestCustomer?.phone || "-";
      const status = ticket.status;
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("id-ID") : "-";
      const redeemedAt = ticket.redeemedAt ? new Date(ticket.redeemedAt).toLocaleString("id-ID") : "-";
      
      const escapedName = `"${name.replace(/"/g, '""')}"`;
      const escapedPhone = `"${phone.replace(/"/g, '""')}"`;
      
      csvContent += `${code},${escapedName},${escapedPhone},${status},${createdAt},${redeemedAt}\n`;
    }

    return csvContent;
  }
}
