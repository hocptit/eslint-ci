import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { CREATE_CIRCLE_WALLET_QUEUE, CREATE_CIRCLE_WALLET_QUEUE_NAME } from '@constants/bull.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { FortressService } from '@modules/wallet/providers/fortress.service';
import WalletRepository from '@models/repositories/Wallet.repository';
import { OwnerService } from '@modules/owner/owner.service';
import { CircleService } from '@modules/payment/circle.service';
import { ICircleCreateWalletQueue } from '@modules/wallet/interface';

@Processor(CREATE_CIRCLE_WALLET_QUEUE_NAME)
export class CircleConsumer {
    constructor(
        private loggerService: LoggerService,
        private readonly configService: ConfigService,
        private readonly fortressService: FortressService,
        private readonly ownerService: OwnerService,
        private readonly walletRepo: WalletRepository,
        private circleService: CircleService,
    ) {}

    private logger = this.loggerService.getLogger('wallet-consumer');

    @Process(CREATE_CIRCLE_WALLET_QUEUE)
    async handleCreateCircleWallet(job: Job<ICircleCreateWalletQueue>) {
        const circleWallet = await this.circleService.createWallet(job.data);
        await this.walletRepo.updateCircleData(job.data.ownerId, circleWallet.data.walletId, circleWallet.data.address);

        await this.ownerService.updateOwner(job.data.ownerId, {
            hasCircleWallet: true,
        });
    }

    @OnQueueFailed()
    async handleQueueError(job: Job, err: Error) {
        this.logger.error(err);
        this.logger.error(`Job ${job} fail with message ${err.message}`);
        await job.moveToFailed({ message: err.message }, true);
    }
}
