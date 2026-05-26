import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { TicketService } from "../service/ticket.service";
import { ResponseUtil } from "../utils";
import { generateTicketsPDF } from "../service/pdf.service";

export const verifyTicketController = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string;
  const data = await TicketService.verifyTicket(code);
  return ResponseUtil.success(res, data);
});

export const redeemTicketController = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string;

  const user = req.storedUser as any;
  const staffId = user.userType === "CASHIER" ? user.id : undefined;
  const staffOutletId = user.userType === "CASHIER" ? user.outletId : req.body?.outletId;

  if (!staffOutletId) {
    return ResponseUtil.badRequest(res, "outletId diperlukan");
  }

  const data = await TicketService.redeemTicket(code, staffId, staffOutletId);
  return ResponseUtil.success(res, data, undefined, "Tiket berhasil di-redeem");
});

export const getTicketsByOrderController = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const data = await TicketService.getTicketsByOrderId(orderId);
  return ResponseUtil.success(res, data);
});

export const getTicketCodesByProductController = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const data = await TicketService.getTicketCodesByProduct(productId, page, limit);
  return ResponseUtil.success(res, data);
});

export const printOrderTicketsController = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const ticketsData = await TicketService.getOrderTicketsPrintData(orderId);

  if (!ticketsData || ticketsData.length === 0) {
    throw new Error("No tickets found for this order");
  }

  const pdfBuffer = await generateTicketsPDF(ticketsData);

  res.contentType("application/pdf");
  res.send(pdfBuffer);
});

export const resendTicketEmailController = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string;
  const result = await TicketService.resendTicketViaEmail(code);
  return ResponseUtil.success(res, result, undefined, "Tiket berhasil dikirim ulang ke email pelanggan");
});

export const shareTicketInfoController = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string;
  const ticket = await TicketService.verifyTicket(code);
  
  const customerName = ticket.customerName || "Pelanggan";
  const productName = ticket.productName;
  const eventDateStr = ticket.eventDate 
    ? new Date(ticket.eventDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
    : "-";
  const venue = ticket.venue || "-";
  const customerAppUrl = process.env.CUSTOMER_APP_URL || "http://localhost:3000";
  const ticketUrl = `${customerAppUrl}/ticket/verify/${code}`;
  const textMessage = `Halo ${customerName}, berikut adalah link e-tiket Anda untuk event ${productName} pada tanggal ${eventDateStr} di ${venue}: ${ticketUrl}. Sampai jumpa di lokasi!`;
  
  return ResponseUtil.success(res, {
    phone: ticket.customerPhone || "",
    customerName,
    productName,
    eventDate: eventDateStr,
    venue,
    ticketUrl,
    messageText: textMessage,
    whatsappUrl: `https://api.whatsapp.com/send?phone=${ticket.customerPhone ? ticket.customerPhone.replace(/[^0-9]/g, '') : ''}&text=${encodeURIComponent(textMessage)}`
  });
});

export const exportTicketsController = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const csvData = await TicketService.exportTicketsToCSV(productId);
  
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=tickets-export-${productId}.csv`);
  return res.send(csvData);
});
