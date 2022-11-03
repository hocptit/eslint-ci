import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { EOrderStatus } from '@constants/exchange.constant';

export enum EMyActiveBidsSortBy {
    UPDATE_AT = 'updated_at',
    BUILD_ORDER = 'build_order',
    CURRENT_BID = 'current_bid',
    REMAIN_TIME = 'remain_time',
}

export class ListMyActiveBidDto extends BasePaginationDto {
    @Min(1)
    @IsInt()
    @ApiProperty()
    limit = 10;

    @Min(1)
    @IsInt()
    @ApiProperty()
    page = 1;

    @ApiPropertyOptional({ enum: EMyActiveBidsSortBy })
    @IsEnum(EMyActiveBidsSortBy)
    @IsOptional()
    sortBy = EMyActiveBidsSortBy.UPDATE_AT;

    @ApiPropertyOptional({ enum: EOrderStatus })
    @IsEnum(EOrderStatus)
    @IsOptional()
    status: EOrderStatus;
}
