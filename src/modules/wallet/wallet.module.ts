import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import WalletRepository from '@models/repositories/Wallet.repository';
import WalletTransactionRepository from '@models/repositories/WalletTransaction.repository';
import { Wallet, WalletSchema } from '@models/entities/Wallet.entity';
import { WalletTransaction, WalletTransactionSchema } from '@models/entities/WalletTransaction.entity';
import { WalletConsole } from '@modules/wallet/wallet.console';
import { CREATE_CIRCLE_WALLET_QUEUE_NAME, CREATE_FORTRESS_WALLET_QUEUE_NAME } from '@constants/bull.constant';
import { BullModule } from '@nestjs/bull';
import { FortressConsumer } from '@modules/wallet/consumers/fortress.consumer';
import { OwnerModule } from '@modules/owner/owner.module';
import { WalletUsecase } from '@modules/wallet/wallet.usecase';
import { PaymentModule } from '@modules/payment/payment.module';
import { FortressService } from '@modules/wallet/providers/fortress.service';
import { NftModule } from '@modules/nft/nft.module';
import { CircleConsumer } from '@modules/wallet/consumers/circle.consumer';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Wallet.name,
                schema: WalletSchema,
            },
            {
                name: WalletTransaction.name,
                schema: WalletTransactionSchema,
            },
        ]),
        BullModule.registerQueue(
            {
                name: CREATE_FORTRESS_WALLET_QUEUE_NAME,
            },
            { name: CREATE_CIRCLE_WALLET_QUEUE_NAME },
        ),
        OwnerModule,
        forwardRef(() => PaymentModule),
        forwardRef(() => NftModule),
    ],
    controllers: [WalletController],
    providers: [
        WalletService,
        WalletRepository,
        WalletTransactionRepository,
        WalletConsole,
        FortressConsumer,
        WalletUsecase,
        FortressService,
        CircleConsumer,
    ],
    exports: [WalletService, WalletRepository, WalletTransactionRepository, FortressService],
})
export class WalletModule {}
