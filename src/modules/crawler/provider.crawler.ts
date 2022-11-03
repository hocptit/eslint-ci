import { Command, Console } from 'nestjs-console';
import { Injectable } from '@nestjs/common';
import { ELatestBlockKey } from '@models/entities/LatestBlock.entity';
import { EEnvKey } from '@constants/env.constant';
import { CRAWLER_EXCHANGE_SC_QUEUE_NAME, CRAWL_NFT_QUEUE_NAME } from '@constants/bull.constant';
import Bluebird from 'bluebird';
import { IQueuePayload } from '@modules/nft/interface';
import Queue from 'bull';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import LatestBlockRepository from '@models/repositories/LatestBlock.repository';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from '@shared/modules/web3/web3.service';
import * as Redis from 'ioredis';

@Console()
@Injectable()
export class ProviderCrawler {
    private queues: Queue.Queue[];
    private readonly redisConfig: Redis.RedisOptions;
    private readonly sleepInMs: number;
    private logger = this.loggerService.getLogger('ProviderCrawler');

    constructor(
        private loggerService: LoggerService,
        private latestBlockRepository: LatestBlockRepository,
        private configService: ConfigService,
        private web3Service: Web3Service,
    ) {
        this.sleepInMs = this.configService.get(EEnvKey.SLEEP_TIME)
            ? Number(this.configService.get(EEnvKey.SLEEP_TIME))
            : Number(2000);
    }
    async bulkAddJobToQueues(payload: IQueuePayload, options: Queue.JobOptions) {
        for (const queue of this.queues) {
            if (
                queue.name === CRAWLER_EXCHANGE_SC_QUEUE_NAME &&
                this.configService.get(EEnvKey.EXCHANGE_FIRST_BLOCK) &&
                payload.fromBlock < Number(this.configService.get(EEnvKey.EXCHANGE_FIRST_BLOCK))
            ) {
                this.logger.info(`Skip block ${payload.toBlock} in queue ${queue.name}`);
                continue;
            }
            await queue.add(payload, options);
            this.logger.info('Push job:', payload, ' into ', queue.name);
        }
    }

    async addToQueuesCollection(queueName: string) {
        const newQueue = await new Queue(queueName, {
            redis: {
                host: this.configService.get<string>(EEnvKey.REDIS_HOST),
                port: this.configService.get<number>(EEnvKey.REDIS_PORT),
                password: this.configService.get<string>(EEnvKey.REDIS_PASSWORD),
                db: this.configService.get<number>(EEnvKey.REDIS_DB_NUMBER),
            },
        });
        this.queues.push(newQueue);
    }
    async initQueues() {
        this.queues = [];
        await this.addToQueuesCollection(CRAWLER_EXCHANGE_SC_QUEUE_NAME);
        await this.addToQueuesCollection(CRAWL_NFT_QUEUE_NAME);
    }

    @Command({
        command: 'provider-crawler <latestKey>',
        description: 'Worker',
    })
    async providerCrawler(latestKey: ELatestBlockKey): Promise<void> {
        await this.initQueues();
        const web3 = this.web3Service.getWeb3();
        let latestBlock = await this.latestBlockRepository.getLatestBlockByKey(latestKey);
        const safeBlock = this.configService.get(EEnvKey.SAFE_BLOCK) || 0;
        if (!latestBlock) {
            latestBlock = await this.latestBlockRepository.latestBlockDocumentModel.create({
                key: latestKey,
                block: this.configService.get(EEnvKey.NFT_FIRST_BLOCK) || (await web3.eth.getBlockNumber()) - 1,
                blockPerProcess: this.configService.get(EEnvKey.BLOCK_PER_PROCESS),
                sleepTime: this.sleepInMs,
            });
        }
        let cursor: number = latestBlock.block;
        const numBlockPerProcess: number = latestBlock.blockPerProcess;
        const sleepTime: number = latestBlock.sleepTime;

        while (1) {
            const currentBlock = (await web3.eth.getBlockNumber()) - safeBlock;
            if (cursor >= currentBlock) {
                this.logger.info(
                    `[providerCrawler] Waiting new block created to continue create task for task ${latestKey}`,
                );
                await Bluebird.delay(sleepTime);
                continue;
            }

            const fromBlock = cursor + 1;
            const toBlock = Math.min(cursor + numBlockPerProcess, currentBlock);
            const payload: IQueuePayload = {
                fromBlock,
                toBlock,
            };

            await this.bulkAddJobToQueues(payload, {
                jobId: `${fromBlock}_${toBlock}`,
                delay: 0,
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
                removeOnComplete: { age: 60 * 60 * 24 * 2 },
                removeOnFail: false,
            });
            await this.latestBlockRepository.updateBlock(latestBlock._id, toBlock);
            cursor = toBlock;
            await Bluebird.delay(sleepTime);
        }
    }
}
