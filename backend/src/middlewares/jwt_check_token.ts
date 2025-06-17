import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

export const jwtCheckToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) return res.status(401).json({ messagge: "Token dibutuhkan." });

    const JWT_SECRET = process.env.JWT_SECRET || "123456";

    verify(token, JWT_SECRET, {
        algorithms: ["HS256"]
    }, (err, decode) => {
        if (err) {
            console.log(err);

            return res.status(401).json({ message: "Token invalid atau sudah kadaluarsa." })
        }
        (req as any).user = decode

        next()
    });

}