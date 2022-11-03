import { Global, Module } from '@nestjs/common';
import { Web3Service } from '@shared/modules/web3/web3.service';

@Global()
@Module({
    imports: [],
    providers: [Web3Service],
    exports: [Web3Service],
})
export class Web3Module {}
