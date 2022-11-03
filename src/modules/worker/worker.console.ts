import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import * as Queue from 'bull';
import { BullLib } from '@modules/worker/bull.lib';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { sleep } from '@shared/utils/promise';
import { DoneCallback, Job } from 'bull';
import { ExchangeService } from '@modules/exchange/exchange.service';
import { EExchangeStatus } from '@constants/exchange.constant';
import { ExchangeDocument } from '@models/entities/Exchange.entity';
import { ExchangeUseCase } from '@modules/exchange/exchange.usecase';
import {
    SETTLE_AUCTION_QUEUE_NAME,
    FORTRESS_SEND_TX_QUEUE_NAME,
    WITHDRAW_MONEY_FROM_FORTRESS_TO_CIRCLE_QUEUE_NAME,
} from '@constants/bull.constant';
import { PaymentUsecase } from '@modules/payment/payment.usecase';
import { WithdrawFiatDto } from '@modules/payment/dto/request/withdraw-fiat.dto';

export enum EExchangeAction {
    CREATE_AUCTION = 'create_auction',
    CREATE_LISTING = 'create_listing',
    BID = 'bid',
    BUY = 'buy',
}

export interface IFortressSendTx {
    actions: EExchangeAction;
    data: any;
}

export interface IWithdrawMoneyFromFortressToCircle {
    ownerId: string;
    sessionId: string;
    withdrawFiatDto: WithdrawFiatDto;
}

@Console()
@Injectable()
export class WorkerConsole {
    private settleAuctionQueue: Queue.Queue;
    private fortressTxQueue: Queue.Queue;
    private withdrawFortressToCircleQueue: Queue.Queue<IWithdrawMoneyFromFortressToCircle>;
    private logger: Logger = this.loggerService.getLogger('Worker');

    constructor(
        private loggerService: LoggerService,
        private configService: ConfigService,
        private exchangeService: ExchangeService,
        private exchangeUseCase: ExchangeUseCase,
        private paymentUseCase: PaymentUsecase,
    ) {}

    async createSettleAuctionQueue() {
        this.settleAuctionQueue = await BullLib.createNewQueue(SETTLE_AUCTION_QUEUE_NAME, {
            host: this.configService.get(EEnvKey.REDIS_HOST),
            port: this.configService.get(EEnvKey.REDIS_PORT),
            password: this.configService.get(EEnvKey.REDIS_PASSWORD),
            db: this.configService.get(EEnvKey.REDIS_DB),
        });
    }

    async createFortressSendTxQueue() {
        this.fortressTxQueue = await BullLib.createNewQueue(FORTRESS_SEND_TX_QUEUE_NAME, {
            host: this.configService.get(EEnvKey.REDIS_HOST),
            port: this.configService.get(EEnvKey.REDIS_PORT),
            password: this.configService.get(EEnvKey.REDIS_PASSWORD),
            db: this.configService.get(EEnvKey.REDIS_DB),
        });
    }

    async createWithdrawFortressToCircleQueue() {
        this.withdrawFortressToCircleQueue = await BullLib.createNewQueue<IWithdrawMoneyFromFortressToCircle>(
            WITHDRAW_MONEY_FROM_FORTRESS_TO_CIRCLE_QUEUE_NAME,
            {
                host: this.configService.get(EEnvKey.REDIS_HOST),
                port: this.configService.get(EEnvKey.REDIS_PORT),
                password: this.configService.get(EEnvKey.REDIS_PASSWORD),
                db: this.configService.get(EEnvKey.REDIS_DB),
            },
        );
    }

    @Command({
        command: 'settle-auction-provider',
        description: 'Settle auction provider',
    })
    async handleSettleAuctionProvider(): Promise<void> {
        await this.createSettleAuctionQueue();
        this.logger.log('Start settle auction provider');
        await this.provider();
    }

    @Command({
        command: 'settle-auction-worker',
        description: 'Settle auction worker',
    })
    async handleSettleAuctionWorker(): Promise<void> {
        await this.createSettleAuctionQueue();
        this.logger.log('Start settle auction worker');
        await this.worker();
    }

    @Command({
        command: 'withdraw-money-from-fortress-to-circle-worker',
        description: 'withdraw money from fortress to circle',
    })
    async handleWithdrawMoneyFromFortressToCircle(): Promise<void> {
        await this.createWithdrawFortressToCircleQueue();
        this.logger.log('Start handleWithdrawMoneyFromFortressToCircle worker');
        await this.withdrawFortressToCircleQueue.process(this.withdrawFortressToCircleWorker.bind(this));
    }

    @Command({
        command: 'handle-send-fortress-tx-worker',
        description: 'Handle send fortress tx worker',
    })
    async handleFortressSendTxWorker(): Promise<void> {
        await this.createFortressSendTxQueue();
        this.logger.log('[handleFortressSendTxWorker] Start worker');
        await this.fortressTxQueue.process(this.fortressSendTxWorker.bind(this));
    }

    async provider() {
        while (1) {
            const exchanges = await this.exchangeService.getExpiredExchanges();
            const payloads: Job[] = [];
            for (const exchange of exchanges) {
                const job = {
                    data: exchange,
                    opts: {
                        jobId: exchange._id,
                        attempts: 5,
                        backoff: {
                            type: 'fixed',
                            delay: 1000 * 60 * 2,
                        },
                        removeOnFail: false,
                    },
                } as Job;
                payloads.push(job);
            }
            this.logger.info(`[provider] Push jobs`, payloads);
            await this.settleAuctionQueue.addBulk(payloads);
            for (const exchange of exchanges) {
                await this.exchangeService.updateExchange({
                    exchangeId: exchange._id,
                    status: EExchangeStatus.HANDLING_AUCTION,
                });
            }
            this.logger.info(
                `[provider] Create job with for bid: ${exchanges.map(exchange => exchange._id).toString()}`,
            );
            await sleep(1000 * 100);
        }
    }

    async handleJobSettleAuction(job: Job, done: DoneCallback) {
        try {
            const payload: ExchangeDocument = job.data;

            await this.exchangeUseCase.settleAuction(payload);

            this.logger.log(`[handleJob] Handle job data`, payload);
            done();
        } catch (e) {
            done(e);
        }
    }

    async worker() {
        const queue = await BullLib.createNewQueue(SETTLE_AUCTION_QUEUE_NAME, {
            host: this.configService.get(EEnvKey.REDIS_HOST),
            port: this.configService.get(EEnvKey.REDIS_PORT),
            password: this.configService.get(EEnvKey.REDIS_PASSWORD),
            db: this.configService.get(EEnvKey.REDIS_DB),
        });

        await queue.process(this.handleJobSettleAuction.bind(this));
    }

    async fortressSendTxWorker(job: Job<IFortressSendTx>, done: DoneCallback) {
        try {
            const payload = job.data;
            console.log('[LOG] - WorkerConsole - payload', payload);
            switch (payload.actions) {
                case EExchangeAction.CREATE_AUCTION:
                    await this.exchangeUseCase.createAuctionExchangeQueueHandler(payload.data);
                    break;
                case EExchangeAction.CREATE_LISTING:
                    await this.exchangeUseCase.createFixedPriceExchangeQueueHandler(payload.data);
                    break;
                case EExchangeAction.BID:
                    await this.exchangeUseCase.bidQueueHandler(payload.data.order, payload.data.sellerAddress);
                    break;
                case EExchangeAction.BUY:
                    await this.exchangeUseCase.buyQueueHandler(payload.data.order, payload.data.sellerAddress);
                    break;
                default:
                    break;
            }
            done();
        } catch (e) {
            this.logger.error(`[fortressSendTxWorker]`, e);
            done(e);
        }
    }

    async withdrawFortressToCircleWorker(job: Job<IWithdrawMoneyFromFortressToCircle>, done: DoneCallback) {
        try {
            const payload = job.data;
            this.logger.info(
                `[withdrawFortressToCircleWorker] Start withdraw money from fortress to circle ${payload}`,
            );
            await this.paymentUseCase.withdrawMoneyFromFortressToCircle(
                payload.ownerId,
                payload.sessionId,
                payload.withdrawFiatDto,
            );
            done();
        } catch (e) {
            this.logger.error(`[fortressSendTxWorker]`, e);
            done(e);
        }
    }
}
