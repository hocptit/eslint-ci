import {
    IsDate,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Length,
    Min,
} from 'class-validator';
import { EExchangeStatus, EExchangeType, EPaginationDirection, EPaginationSortBy } from '@constants/exchange.constant';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/Pagination.dto';
import { getUnixTimestamp } from '@shared/utils/format';

export class GetPendingOrOpenExchangeDto {
    nftId: number;
    userId: string;
}

export class CreateFixedPriceExchangeDto {
    @ApiProperty()
    @IsInt()
    nftId: number;

    @ApiProperty()
    @IsNumber()
    @IsPositive()
    price: number;
}

export class CreateAuctionExchangeDto {
    @ApiProperty()
    @IsInt()
    nftId: number;

    @ApiProperty()
    @IsNumber()
    @IsPositive()
    price: number;

    @ApiProperty()
    @IsInt()
    @Min(getUnixTimestamp())
    auctionStartAt: number;

    @ApiProperty()
    @IsInt()
    @Min(getUnixTimestamp())
    auctionEndAt: number;
}
export class UpdateExchangeDto {
    exchangeId: string;
    status: EExchangeStatus;
}
export class GetExchangesDto extends PaginationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    _id?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    price?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    userId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    nftId?: string;

    @ApiProperty({ required: false, enum: EExchangeType })
    @IsOptional()
    @IsEnum(EExchangeType)
    type?: EExchangeType;

    @ApiProperty({ required: false, enum: EExchangeStatus })
    @IsOptional()
    @IsEnum(EExchangeStatus)
    status?: EExchangeStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDate()
    createdAt?: Date;

    @ApiProperty({ required: false, enum: EPaginationSortBy })
    @IsOptional()
    @IsEnum(EPaginationSortBy)
    sortBy?: EPaginationSortBy;

    @ApiProperty({ required: false, enum: EPaginationDirection })
    @IsOptional()
    @IsEnum(EPaginationDirection)
    direction?: EPaginationDirection;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDate()
    fromDate?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDate()
    toDate?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    @IsPositive()
    endIn?: number;
}

export class GetOneExchangeDto {
    @ApiProperty()
    @IsString()
    @Length(24, 24)
    exchangeId: string;
}
export class BidDto {
    @ApiProperty()
    @IsString()
    @Length(24, 24)
    exchangeId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    bidAmount: number;
}
