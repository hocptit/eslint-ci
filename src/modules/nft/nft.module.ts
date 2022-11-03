import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NftTransaction, NftTransactionSchema } from '@models/entities/NftTransaction.entity';
import { NftController } from './nft.controller';
import NftTransactionRepository from '@models/repositories/NftTransaction.repository';
import { BullModule } from '@nestjs/bull';
import { TRANSFER_NFT_QUEUE_NAME } from '@constants/bull.constant';
import { NftTransferConsumer } from '@modules/nft/nft.consumer';
import { NftService } from '@modules/nft/nft.service';
import { WalletModule } from '@modules/wallet/wallet.module';
import { LatestBlock, LatestBlockSchema } from '@models/entities/LatestBlock.entity';
import LatestBlockRepository from '@models/repositories/LatestBlock.repository';
import { Nft, NftSchema } from '@models/entities/Nft.entity';
import NftRepository from '@models/repositories/Nft.repository';
import { NftUsecase } from '@modules/nft/nft.usecase';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: NftTransaction.name,
                schema: NftTransactionSchema,
            },
            {
                name: LatestBlock.name,
                schema: LatestBlockSchema,
            },
            {
                name: Nft.name,
                schema: NftSchema,
            },
        ]),
        BullModule.registerQueue({ name: TRANSFER_NFT_QUEUE_NAME }),
        HttpModule.register({
            timeout: 50000,
            maxRedirects: 5,
        }),
        forwardRef(() => WalletModule),
    ],
    controllers: [NftController],
    providers: [
        NftService,
        NftTransactionRepository,
        LatestBlockRepository,
        NftTransferConsumer,
        NftRepository,
        NftUsecase,
    ],
    exports: [NftService, NftTransactionRepository],
})
export class NftModule {}
