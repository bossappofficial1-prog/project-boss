import { Router } from "express";
import { ToolsController } from "../controller/tools.controller";
import { ToolsService } from "../service/tools.service";
import { protect } from "src/middleware/auth.middleware";

const toolsRouter = Router();

// Inisialisasi Service dan Controller
const toolsService = new ToolsService();
const toolsController = new ToolsController(toolsService);

toolsRouter.use(protect);

// Definisi Rute
toolsRouter.get("/profit-per-product", toolsController.getProfitPerProduct);
toolsRouter.get("/business-health", toolsController.getBusinessHealth);
toolsRouter.get("/peak-hours", toolsController.getPeakHours);
toolsRouter.get("/income-statement", toolsController.getIncomeStatement);

export default toolsRouter;
