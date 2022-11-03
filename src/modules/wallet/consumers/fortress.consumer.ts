import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { CREATE_FORTRESS_WALLET_QUEUE, CREATE_FORTRESS_WALLET_QUEUE_NAME } from '@constants/bull.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { CreateAddressWalletType, IGetFortressWalletResponse } from '@modules/wallet/interface/fortress.interface';
import { FortressService } from '@modules/wallet/providers/fortress.service';
import WalletRepository from '@models/repositories/Wallet.repository';
import { OwnerService } from '@modules/owner/owner.service';

@Processor(CREATE_FORTRESS_WALLET_QUEUE_NAME)
export class FortressConsumer {
    constructor(
        private loggerService: LoggerService,
        private readonly configService: ConfigService,
        private readonly fortressService: FortressService,
        private readonly ownerService: OwnerService,
        private readonly walletRepo: WalletRepository,
    ) {}

    private logger = this.loggerService.getLogger('wallet-consumer');

    @Process(CREATE_FORTRESS_WALLET_QUEUE)
    async handleCreateFortressWallet(job: Job<CreateAddressWalletType>) {
        this.logger.info(`start handle job: ${job}`);
        const walletData: IGetFortressWalletResponse = await this.fortressService.createFortressWallet(job.data);
        const walletUpdated = await this.walletRepo.updateFortressData(
            job.data.name,
            walletData.id,
            walletData.addresses[0].address,
        );

        await this.ownerService.updateOwner(job.data.name, {
            hasInternalWallet: true,
            walletId: walletUpdated.fortressWalletId,
            walletAddress: walletUpdated.fortressWalletAddress,
        });
    }

    @OnQueueFailed()
    async handleQueueError(job: Job, err: Error) {
        this.logger.error(err);
        this.logger.error(`Job ${job} fail with message ${err.message}`);
        await job.moveToFailed({ message: err.message }, true);
    }
}
