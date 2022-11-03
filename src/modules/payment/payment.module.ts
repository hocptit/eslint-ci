import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import MarketplaceTransactionRepository from '@models/repositories/MarketplaceTransaction.repository';
import { MarketplaceTransaction, MarketplaceTransactionSchema } from '@models/entities/MarketplaceTransaction.entity';
import { CircleService } from './circle.service';
import { CoinMarketCapService } from './coinmarketcap.service';
import { ConfigModule } from '@nestjs/config';
import { PaymentUsecase } from './payment.usecase';
import { OwnerModule } from '@modules/owner/owner.module';
import { WalletModule } from '@modules/wallet/wallet.module';

import { WireBankAccount, WireBankAccountSchema } from '@models/entities/WireBankAccount.entity';
import WireBankAccountRepository from '@models/repositories/WireBankAccount.repository';
import { NotifyModule } from '@modules/notify/notify.module';
import { Web3Module } from '@shared/modules/web3/web3.module';
import { BullModule } from '@nestjs/bull';
import { CIRCLE_WEBHOOK_EVENT_QUEUE_NAME } from '@constants/bull.constant';
import { CircleWebhookProcessor } from './webhook-circle.processsor';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: MarketplaceTransaction.name,
                schema: MarketplaceTransactionSchema,
            },
            {
                name: WireBankAccount.name,
                schema: WireBankAccountSchema,
            },
        ]),
        ConfigModule,
        OwnerModule,
        forwardRef(() => WalletModule),
        forwardRef(() => NotifyModule),
        Web3Module,
        BullModule.registerQueue({ name: CIRCLE_WEBHOOK_EVENT_QUEUE_NAME }),
    ],
    controllers: [PaymentController],
    providers: [
        PaymentService,
        MarketplaceTransactionRepository,
        CircleService,
        CoinMarketCapService,
        PaymentUsecase,
        WireBankAccountRepository,
        CircleWebhookProcessor,
    ],
    exports: [CircleService, PaymentUsecase],
})
export class PaymentModule {}
