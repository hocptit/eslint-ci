import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { TRANSFER_NFT_QUEUE, TRANSFER_NFT_QUEUE_NAME } from '@constants/bull.constant';
import { Job } from 'bull';
import { TransferNft } from '@modules/nft/dto/transfer-nft.dto';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { FortressService } from '@modules/wallet/providers/fortress.service';
import { IFortressNftBalancesInWalletResponse } from '@modules/wallet/interface';

@Processor(TRANSFER_NFT_QUEUE_NAME)
export class NftTransferConsumer {
    constructor(private loggerService: LoggerService, private readonly fortressService: FortressService) {}

    private logger = this.loggerService.getLogger('NftTransferConsumer');

    @Process(TRANSFER_NFT_QUEUE)
    async handleTransferNft(job: Job<TransferNft>) {
        this.logger.info(`[handleTransferNft] Start handle job transfer NFT: ${job.data}`);
        const fortressAuthToken: string = await this.fortressService.getAuthFortressRes();
        // get nfts of wallet
        const nfts: IFortressNftBalancesInWalletResponse[] = await this.fortressService.getBalanceNfts(
            job.data.walletId,
            fortressAuthToken,
        );
        const nftIds = await Promise.all(
            nfts[0].nftTokenBalances.map(async nft => {
                const nftUuidId = nft.tokenId;
                const tokenId = await this.fortressService.getNFtIdByTokenId(nftUuidId, fortressAuthToken);
                return {
                    tokenId,
                    nftUuidId,
                };
            }),
        );
        const tokenId = nftIds.find(nft => nft.tokenId === job.data.tokenId).nftUuidId;
        job.data = {
            ...job.data,
            tokenId: tokenId,
        };
        await this.fortressService.transferNft(job.data, fortressAuthToken);
    }

    @OnQueueFailed()
    async handleQueueError(job: Job, err: Error) {
        this.logger.error(`[handleQueueError] Job ${job} fail with message ${err.message}`);
        await job.moveToFailed({ message: err.message }, true);
    }
}
