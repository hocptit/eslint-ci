import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length } from 'class-validator';
import { EOrderStatus, EOrderType, EPaginationDirection, EPaginationSortBy } from '@constants/exchange.constant';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/Pagination.dto';

export class CreateOrderDto {
    type: EOrderType;
    exchangeId: string;
    userId: string;
    nftId: number;
    nftAddress: string;
    erc20Address: string;
    price: number;
    status: EOrderStatus;
}
export class GetOrdersDto extends PaginationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    id?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    exchangeId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    ownerId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    tokenId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(EOrderType)
    type?: EOrderType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(EOrderStatus)
    status?: EOrderStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(EPaginationDirection)
    direction?: EPaginationDirection;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEnum(EPaginationSortBy)
    sortBy?: EPaginationSortBy;
}
export class UpdateOrderDto {
    @IsNotEmpty()
    @IsString()
    @Length(24, 24)
    exchangeId: string;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    price?: number;

    @IsNotEmpty()
    @IsString()
    @Length(24, 24)
    ownerId?: string;

    @ApiProperty()
    @IsEnum(EOrderStatus)
    status: EOrderStatus;
}

export class GetHighestBidDto {
    @IsNotEmpty()
    @IsString()
    @Length(24, 24)
    exchangeId: string;

    @IsNotEmpty()
    @IsOptional()
    @IsString()
    @Length(24, 24)
    ownerId?: string;
}

export class CancelAuctionDto {
    @IsNotEmpty()
    @IsString()
    @Length(24, 24)
    exchangeId: string;

    @IsNotEmpty()
    @IsString()
    @Length(24, 24)
    ownerId: string;
}

export class CheckBidderDto {
    @IsNotEmpty()
    @IsString()
    @Length(24, 24)
    exchangeId: string;
}
