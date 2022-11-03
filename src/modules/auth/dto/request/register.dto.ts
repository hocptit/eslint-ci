import { ApiProperty } from '@nestjs/swagger';
import { EPreferredColor } from '@modules/owner/owner.constant';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty()
    avatar: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    alias: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    country: string;

    @ApiProperty()
    hearedAboutUsPlatforms: string[];

    @ApiProperty()
    preferredColor: EPreferredColor;
}
