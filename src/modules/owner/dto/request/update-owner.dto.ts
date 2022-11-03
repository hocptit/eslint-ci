import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { EPreferredColor } from '@modules/owner/owner.constant';

export class UpdateOwnerDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    facebookId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional()
    @IsOptional()
    hearedAboutUsPlatforms?: string[];

    @ApiPropertyOptional({ enum: EPreferredColor })
    @IsOptional()
    preferredColor?: EPreferredColor;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    fromLA?: boolean;
}
