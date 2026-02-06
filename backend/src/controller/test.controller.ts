import { TestQueue } from "../queues/test.queue";

export class TestController {
    private testQueue = new TestQueue()

    async sendTest(name: string) {
        await this.testQueue.add(
            { name },
            { attempts: 3, backoff: 500 }
        )
    }
}

export const testController = new TestController()