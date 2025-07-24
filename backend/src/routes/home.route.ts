import { Router } from "express";
import { getHomeSummaryController } from "../controller/home.controller";

const homeRouter = Router();

// Rute publik untuk mendapatkan ringkasan data home
homeRouter.get("/", getHomeSummaryController);

export default homeRouter;