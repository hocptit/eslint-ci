import { Injectable } from '@nestjs/common';
import { NftService } from '@modules/nft/nft.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';

@Injectable()
export class NftUsecase {
    constructor(public nftService: NftService, private loggerService: LoggerService) {}
    private logger = this.loggerService.getLogger('NftService');
}
