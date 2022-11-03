import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    MemoryHealthIndicator,
    MicroserviceHealthIndicator,
    MongooseHealthIndicator,
} from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { Transport, RedisOptions } from '@nestjs/microservices';
import { EEnvKey } from '@constants/env.constant';
import { ConfigService } from '@nestjs/config';

@Controller('/info')
export class HealthController {
    constructor(
        private healthCheckService: HealthCheckService,
        private http: HttpHealthIndicator,
        private memory: MemoryHealthIndicator,
        private db: MongooseHealthIndicator,
        private microservice: MicroserviceHealthIndicator,
        private config: ConfigService,
    ) {}
    @Get('/health-x-y-z-a')
    @HealthCheck()
    async check(): Promise<HealthCheckResult> {
        return this.healthCheckService.check([
            () =>
                this.http.pingCheck('Google', 'https://www.google.com', {
                    timeout: 5000,
                }),
            () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
            () => this.db.pingCheck('mongoose'),
            () =>
                this.microservice.pingCheck<RedisOptions>('redis', {
                    transport: Transport.REDIS,
                    options: {
                        host: this.config.get<string>(EEnvKey.REDIS_HOST),
                        port: this.config.get<number>(EEnvKey.REDIS_PORT),
                        password: this.config.get<string>(EEnvKey.REDIS_PASSWORD),
                        db: this.config.get<string>(EEnvKey.REDIS_DB_NUMBER),
                    },
                }),
        ]);
    }
}
