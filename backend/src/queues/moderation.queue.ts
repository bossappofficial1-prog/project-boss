import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { ModerationService } from "../service/moderation.service";

export interface ModerationJobData {
    filePath: string;
    filename: string;
}

export class ModerationQueue extends BaseQueue<ModerationJobData> {
    constructor() {
        super('moderation-queue');
    }

    protected async handle(job: Job<ModerationJobData>): Promise<void> {
        const { filePath, filename } = job.data;
        console.log(`[Moderation Queue] Processing background moderation for job: ${job.id}, file: ${filename}`);
        await ModerationService.processBackgroundModeration(filePath, filename);
    }
}

export const moderationQueue = new ModerationQueue();
