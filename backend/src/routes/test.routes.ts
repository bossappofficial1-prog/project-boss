import { Router } from "express";
import { TestController } from "../controllers/test.controller";

const testRouter = Router()

testRouter.get("/", TestController)

export default testRouter