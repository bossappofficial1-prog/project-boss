import { Router } from "express";
import { ServerMonitorController } from "../controller/server.controller";

const serverRouter = Router();
const serverMonitorController = new ServerMonitorController()

serverRouter.get('/status/stream', serverMonitorController.getServerStatusStream.bind(serverMonitorController))

export default serverRouter