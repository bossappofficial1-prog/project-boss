import Queue, { Job, QueueOptions } from 'bull';
import { config } from '../config';

export abstract class BaseQueue<T> {
    protected queue: Queue.Queue<T>;
    public readonly name: string

    constructor(queueName: string, options?: QueueOptions) {
        this.name = queueName
        this.queue = new Queue<T>(queueName, {
            redis: {
                host: config.redis.host,
                port: config.redis.port
            },
            ...options,
        });

        this.queue.process(this.handle.bind(this));

    }

    protected abstract handle(job: Job<T>): Promise<void>;

    async add(data: T, options?: Queue.JobOptions): Promise<Job<T>> {
        return this.queue.add(data, options);
    }
}
