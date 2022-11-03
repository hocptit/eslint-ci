import { EEnvKey } from '@constants/env.constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequentialRoundRobin } from 'round-robin-js';

@Injectable()
export class RoundRobinService {
    private adminPrivateKeyTable: SequentialRoundRobin<string>;

    constructor(private configService: ConfigService) {
        this.adminPrivateKeyTable = new SequentialRoundRobin(this.adminPrivateKeysFromEnv());
    }

    adminPrivateKeysFromEnv() {
        const adminPrivateKeys = this.configService.get<string>(EEnvKey.ADMIN_PRIVATE_KEYS).split(',');
        return adminPrivateKeys;
    }

    getAdminPrivateKey() {
        return this.adminPrivateKeyTable.next();
    }
}
