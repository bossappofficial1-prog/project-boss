export class AppError extends Error {
    public errors?: any[];
    public statusCode?: number;

    constructor(messsage: string, statusCode?: number, errors?: any[]) {
        super(messsage)
        this.errors = errors;
        this.statusCode = statusCode;

        Object.setPrototypeOf(this, AppError.prototype)
        Error.captureStackTrace(this, this.constructor)
    }
}