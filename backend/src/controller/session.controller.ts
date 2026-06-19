import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { SessionService } from "../service/session.service";
import { HttpStatus } from "../constants/http-status";

class SessionController extends BaseController {
  listSessions = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const currentSessionId = req.storedUser!.sessionId;

    const sessions = await SessionService.list(userId, currentSessionId || "");
    return this.success(res, { sessions });
  });

  revokeSession = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const sessionId = req.params.sessionId as string;

    if (sessionId === req.storedUser!.sessionId) {
      return this.error(res, "Tidak dapat mencabut sesi saat ini", undefined, HttpStatus.BAD_REQUEST);
    }

    await SessionService.revoke(userId, sessionId);
    return this.success(res, { message: "Sesi berhasil dicabut" });
  });

  revokeOtherSessions = this.handler(async (req: Request, res: Response) => {
    const userId = req.storedUser!.id;
    const currentSessionId = req.storedUser!.sessionId || "";

    const count = await SessionService.revokeOtherSessions(userId, currentSessionId);
    return this.success(res, {
      message: `${count} sesi lainnya berhasil dicabut`,
      count,
    });
  });
}

export const sessionController = new SessionController();
