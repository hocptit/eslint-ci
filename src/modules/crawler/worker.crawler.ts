import { Command, Console } from 'nestjs-console';
import { Injectable } from '@nestjs/common';
import { CRAWLER_EXCHANGE_SC_QUEUE_NAME, CRAWL_NFT_QUEUE_NAME } from '@constants/bull.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import LatestBlockRepository from '@models/repositories/LatestBlock.repository';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from '@shared/modules/web3/web3.service';
import { EEnvKey } from '@constants/env.constant';
import * as Redis from 'ioredis';
import Queue, { DoneCallback, Job } from 'bull';
import { IQueuePayload, IWeb3Event } from '@modules/nft/interface';
import { Contract, EventData } from 'web3-eth-contract';
import pLimit from 'p-limit';
import { NftService } from '@modules/nft/nft.service';
import { ExchangeUseCase } from '@modules/exchange/exchange.usecase';

const limit = pLimit(5);

@Console()
@Injectable()
export class WorkerCrawler {
    private readonly redisConfig: Redis.RedisOptions;
    private logger = this.loggerService.getLogger('WorkerCrawler');

    constructor(
        private loggerService: LoggerService,
        private latestBlockRepository: LatestBlockRepository,
        private configService: ConfigService,
        private web3Service: Web3Service,
        private nftService: NftService,
        private exchangeUseCase: ExchangeUseCase,
    ) {
        this.web3Service = new Web3Service(this.configService);
    }

    @Command({
        command: 'worker-crawler-exchange',
        description: 'Worker',
    })
    async handleExchange(): Promise<void> {
        const queueCrawlExchange = await new Queue(CRAWLER_EXCHANGE_SC_QUEUE_NAME, {
            redis: {
                host: this.configService.get<string>(EEnvKey.REDIS_HOST),
                port: this.configService.get<number>(EEnvKey.REDIS_PORT),
                password: this.configService.get<string>(EEnvKey.REDIS_PASSWORD),
                db: this.configService.get<number>(EEnvKey.REDIS_DB_NUMBER),
            },
        });
        await queueCrawlExchange.process(this.handleJobCrawlerExchange.bind(this));
    }

    @Command({
        command: 'worker-crawler-nft',
        description: 'Worker',
    })
    async handleNft(): Promise<void> {
        //todo: optimize duplicate
        const queueCrawlNft = await new Queue(CRAWL_NFT_QUEUE_NAME, {
            redis: {
                host: this.configService.get<string>(EEnvKey.REDIS_HOST),
                port: this.configService.get<number>(EEnvKey.REDIS_PORT),
                password: this.configService.get<string>(EEnvKey.REDIS_PASSWORD),
                db: this.configService.get<number>(EEnvKey.REDIS_DB_NUMBER),
            },
        });
        await queueCrawlNft.process(this.handleJobCrawlerNft.bind(this));
    }

    async getBlockTimeByBlockNumbers(eventLogs: EventData[]) {
        const blockNumbers = Array.from(new Set(eventLogs.map((log: EventData) => log.blockNumber)));
        const blockInfos = await Promise.all(
            blockNumbers.map(async (blockNumber: number) =>
                limit(() => this.web3Service.getWeb3().eth.getBlock(blockNumber)),
            ),
        );
        return blockInfos.reduce((blockTimeByNumber: any, blockInfo: any) => {
            return {
                ...blockTimeByNumber,
                [blockInfo.number]: blockInfo.timestamp,
            };
        }, {});
    }

    async getPastEvents(contract: Contract, payload: IQueuePayload): Promise<IWeb3Event[]> {
        const events: EventData[] = await contract.getPastEvents('allEvents', {
            fromBlock: payload.fromBlock,
            toBlock: payload.toBlock,
        });
        const blocksInfo = await this.getBlockTimeByBlockNumbers(events);
        return events.map((event: EventData): IWeb3Event => {
            return {
                ...event,
                blockTime: blocksInfo[event.blockNumber] as unknown as number,
            };
        });
    }

    async handleJobCrawlerExchange(job: Job, done: DoneCallback) {
        try {
            const payload: IQueuePayload = job.data;
            this.logger.log(`[handleJobCrawler] Handle job data`, payload);
            const formatEvents = await this.getPastEvents(this.web3Service.getExchangeContract(), payload);
            this.logger.info(`[handleJobCrawler] Data event`, formatEvents);
            for (const event of formatEvents) {
                switch (event.event) {
                    case 'NftListed':
                        await this.exchangeUseCase.handleNftListedEvent(event);
                        break;
                    case 'NftSold':
                        await this.exchangeUseCase.handleNftSoldEvent(event);
                        break;
                    case 'AuctionCreated':
                        await this.exchangeUseCase.handleCreateNftAuctionEvent(event);
                        break;
                    case 'BidPlaced':
                        await this.exchangeUseCase.handlePlaceBidEvent(event);
                        break;
                    case 'AuctionSettled':
                        await this.exchangeUseCase.handleSettleAuctionEvent(event);
                        break;
                    default:
                        break;
                }
            }
            done();
        } catch (e) {
            this.logger.error(`[handleJobCrawlerExchange]`, e);
            done(e);
        }
    }

    async handleJobCrawlerNft(job: Job, done: DoneCallback) {
        try {
            const payload: IQueuePayload = job.data;
            this.logger.log(`[handleJobCrawler] Handle job data`, payload);
            const formatEvents = await this.getPastEvents(this.web3Service.getNftContract(), payload);
            this.logger.info(`[handleJobCrawler] Data event`, formatEvents);
            for (const event of formatEvents) {
                switch (event.event) {
                    case 'Transfer':
                        await this.nftService.handleTransferNft(event);
                        break;
                    case 'Approval':
                        // await this.nftService.handleApprovalNft(event);
                        break;
                    case 'ApprovalForAll':
                        // await this.nftService.handleApprovalForAllNft(event);
                        break;
                    default:
                        break;
                }
            }
            done();
        } catch (e) {
            this.logger.error(`[handleJobCrawlerNft]`, e);
            done(e);
        }
    }
}
