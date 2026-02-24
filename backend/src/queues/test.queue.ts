import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import Console from "../utils/logger";

export class TestQueue extends BaseQueue<{ name: string }> {
    constructor() {
        super('test-queue')
    }

    protected async handle(job: Job<{ name: string; }>): Promise<void> {
        const { name } = job.data

        Console.log(name)
    }
}