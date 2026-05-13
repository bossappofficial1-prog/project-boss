import { Router } from "express";
import { ToolsController } from "../controller/tools.controller";
import { ToolsService } from "../service/tools.service";


const toolsRouter = Router();

// Inisialisasi Service dan Controller
const toolsService = new ToolsService();
const toolsController = new ToolsController(toolsService);

// Definisi Rute
toolsRouter.get("/profit-per-product", toolsController.getProfitPerProduct);
toolsRouter.get("/business-health", toolsController.getBusinessHealth);

export default toolsRouter;
