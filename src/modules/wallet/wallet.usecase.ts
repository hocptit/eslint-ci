import { WalletService } from '@modules/wallet/wallet.service';
import { WalletDocument } from '@models/entities/Wallet.entity';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Web3Service } from '@shared/modules/web3/web3.service';
import { FortressService } from '@modules/wallet/providers/fortress.service';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { IWalletUSDCOfOwner } from '@modules/wallet/interface';
import { NftService } from '@modules/nft/nft.service';
import { CircleService } from '@modules/payment/circle.service';
import { ListWalletTransactionDto } from '@modules/wallet/dto/list-wallet-transaction.dto';
import { EAction } from '@models/entities/WalletTransaction.entity';

@Injectable()
export class WalletUsecase {
    constructor(
        public readonly walletService: WalletService,
        private loggerService: LoggerService,
        private web3Service: Web3Service,
        private fortressService: FortressService,
        private configService: ConfigService,
        @Inject(forwardRef(() => NftService))
        private nftService: NftService,
        private circleService: CircleService,
    ) {}
    private logger = this.loggerService.getLogger('WalletUsecase');

    getWalletOfOwner(ownerId: string): Promise<WalletDocument> {
        return this.walletService.getOwnerWallet(ownerId);
    }

    async getWalletTransaction(ownerId: string, listTransactionDto: ListWalletTransactionDto) {
        const ownerWallet = await this.getWalletOfOwner(ownerId);
        return this.walletService.listWithPagination(listTransactionDto, {
            walletId: ownerWallet._id,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            action: { $nin: [EAction.APPROVE_USDC, EAction.TRANSFER_USDC, EAction.APPROVE_NFT] },
        });
    }

    async getWalletUSDCOfOwner(ownerId: string): Promise<IWalletUSDCOfOwner> {
        const ownerWallet = await this.getWalletOfOwner(ownerId);
        const circleWallet = await this.circleService.getWallet(ownerWallet.circleWalletId);
        console.log(circleWallet);
        const usdcBalance = circleWallet.data.balances.find(balance => balance.currency === 'USD')?.amount || '0';
        return {
            ownerId: ownerWallet.ownerId,
            fortressWalletId: ownerWallet.fortressWalletId,
            fortressWalletAddress: ownerWallet.fortressWalletAddress,
            circleWalletId: ownerWallet.circleWalletId,
            circleAddressOnPolygon: ownerWallet.circleAddressOnPolygon,
            usdcAddress: this.configService.get<string>(EEnvKey.USDC_CONTRACT_ADDRESS),
            exchangeAddress: this.configService.get<string>(EEnvKey.EXCHANGE_CONTRACT_ADDRESS),
            circleBalance: usdcBalance,
        };
    }
}
