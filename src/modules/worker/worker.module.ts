import { Module } from '@nestjs/common';

import { WorkerConsole } from '@modules//worker/worker.console';
import { MongooseModule } from '@nestjs/mongoose';
import { Exchange, ExchangeSchema } from '@models/entities/Exchange.entity';
import ExchangeRepository from '@models/repositories/Exchange.repository';
import { ExchangeModule } from '@modules/exchange/exchange.module';
import { PaymentModule } from '@modules/payment/payment.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Exchange.name,
                schema: ExchangeSchema,
            },
        ]),
        ExchangeModule,
        PaymentModule,
    ],
    controllers: [],
    providers: [WorkerConsole, ExchangeRepository],
    exports: [],
})
export class WorkerModule {}
