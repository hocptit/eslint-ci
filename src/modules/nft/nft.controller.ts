import { Controller, Get, Query } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, UseAuthGuard } from '@shared/decorators/auth.decorator';
import { NftUsecase } from '@modules/nft/nft.usecase';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { Nft } from '@models/entities/Nft.entity';
import { GetNftsQueryDto } from '@modules/nft/dto/get-nfts.dto';
import { IPaginationMetadata } from '@shared/utils/format';

@ApiTags('nft')
@Controller('nft')
@UseAuthGuard()
export class NftController {
    constructor(private loggerService: LoggerService, private nftUsecase: NftUsecase) {}
    private logger = this.loggerService.getLogger('NftController');

    @Get()
    @ApiOkResponsePayload(Nft, EApiOkResponsePayload.ARRAY, true)
    getNft(
        @CurrentUser() user: IPayloadUserJwt,
        @Query() query: GetNftsQueryDto,
    ): Promise<{
        data: Nft[];
        _metadata: IPaginationMetadata;
    }> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sortBy, direction, page, limit, ...filter } = query || {};
        return this.nftUsecase.nftService.listWithPagination(query, { ...filter, ownerId: user.ownerId });
    }
}
