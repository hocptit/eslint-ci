import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { memoryStorage } from 'multer';
import { ConsoleModule } from 'nestjs-console';

import { ConfigurationModule } from '@config/config.module';
import { DatabaseModule } from '@config/database.module';

import { LoggingModule } from '@shared/modules/loggers/logger.module';
import { Web3Module } from '@shared/modules/web3/web3.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MODULES } from './modules';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtStrategy } from '@shared/strategy/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { HttpModuleGlobal } from '@shared/modules/http-module/http.module';
import { HealthController } from '@shared/modules/health/health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
    imports: [
        ConfigurationModule,
        HttpModuleGlobal,
        DatabaseModule,
        LoggingModule,
        ConsoleModule,
        Web3Module,
        MulterModule.register({
            storage: memoryStorage(),
        }),
        ScheduleModule.forRoot(),
        ...MODULES,
        AuthModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                return {
                    redis: {
                        host: config.get<string>(EEnvKey.REDIS_HOST),
                        port: config.get<number>(EEnvKey.REDIS_PORT),
                        password: config.get<string>(EEnvKey.REDIS_PASSWORD),
                        db: config.get<number>(EEnvKey.REDIS_DB_NUMBER),
                    },
                };
            },
        }),
        JwtModule.register({}),
        TerminusModule,
    ],
    controllers: [AppController, HealthController],
    providers: [AppService, JwtStrategy],
})
export class AppModule {}
