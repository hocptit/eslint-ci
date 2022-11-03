import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LatestBlock, LatestBlockSchema } from '@models/entities/LatestBlock.entity';
import { WorkerCrawler } from '@modules/crawler/worker.crawler';
import { ProviderCrawler } from '@modules/crawler/provider.crawler';
import LatestBlockRepository from '@models/repositories/LatestBlock.repository';
import { NftModule } from '@modules/nft/nft.module';
import { ExchangeModule } from '@modules/exchange/exchange.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: LatestBlock.name,
                schema: LatestBlockSchema,
            },
        ]),
        NftModule,
        ExchangeModule,
    ],
    controllers: [],
    providers: [WorkerCrawler, ProviderCrawler, LatestBlockRepository],
    exports: [],
})
export class CrawlerModule {}
