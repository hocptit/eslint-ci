import Queue from 'bull';
import * as Redis from 'ioredis';

export class BullLib {
    static async createNewQueue<T>(queueName: string, redisConfig: Redis.RedisOptions): Promise<Queue.Queue<T>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return new Queue(queueName, {
            redis: redisConfig,
            settings: {
                lockDuration: 300000,
                lockRenewTime: 150000,
            },
        });
    }
}
