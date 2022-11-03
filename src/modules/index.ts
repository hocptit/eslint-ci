import { SeederModule } from '@modules/seeder/seeder.module';
// import { TemplateModule } from '@modules/template/template.module';
import { NftModule } from '@modules/nft/nft.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { WorkerModule } from '@modules/worker/worker.module';
import { ExchangeModule } from '@modules/exchange/exchange.module';
import { OwnerModule } from '@modules/owner/owner.module';
import { NotifyModule } from '@modules/notify/notify.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { EmailModule } from '@modules/notify/email/email.module';
import { CrawlerModule } from '@modules/crawler/crawler.module';

export const MODULES = [
    SeederModule,
    WorkerModule,
    ExchangeModule,
    NftModule,
    WalletModule,
    OwnerModule,
    NotifyModule,
    PaymentModule,
    EmailModule,
    CrawlerModule,
];
