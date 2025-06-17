import { Request, Response } from "express";
import { ResponseApiType } from "../types/api_types";
import { handlerAnyError } from "../errors/api_errors";
import { TestServices } from "../services/test.service";

export async function TestController(req: Request, res: Response) {
    try {
        const data = await TestServices()

        return res.status(200).json({
            success: true,
            message: "Test data",
            data
        })
    } catch (error) {
        return handlerAnyError(error, res)
    }
}