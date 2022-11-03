import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ExchangeUseCase } from './exchange.usecase';
import ExchangeRepository from '@models/repositories/Exchange.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Exchange, ExchangeSchema } from '@models//entities/Exchange.entity';
import OrderRepository from '@models/repositories/Order.repository';
import { Order, OrderSchema } from '@models/entities/Order.entity';
import { ExchangeController } from '@modules/exchange/exchange.controller';
// import OwnerRepository from '@models/repositories/Owner.repository';
// import { OwnerService } from '@modules/owner/owner.service';
import { OwnerModule } from '@modules/owner/owner.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { NftModule } from '@modules/nft/nft.module';
import { RoundRobinService } from './providers/round-robin.service';
@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Exchange.name,
                schema: ExchangeSchema,
            },
            {
                name: Order.name,
                schema: OrderSchema,
            },
        ]),
        OwnerModule,
        WalletModule,
        NftModule,
    ],
    providers: [ExchangeService, ExchangeRepository, OrderRepository, ExchangeUseCase, RoundRobinService],
    controllers: [ExchangeController],
    exports: [ExchangeService, ExchangeUseCase],
})
export class ExchangeModule {}
