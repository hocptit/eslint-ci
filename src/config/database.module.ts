import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import paginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

import { EEnvKey } from '@constants/env.constant';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const uri = configService.get<string>(EEnvKey.MONGO_URI);
                return {
                    uri,
                    connectionFactory: connection => {
                        connection.plugin(paginate);
                        connection.plugin(aggregatePaginate);
                        return connection;
                    },
                };
            },
        }),
    ],
})
export class DatabaseModule {}
