import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckAuthDto {
    @ApiProperty({ example: 'http://localhost:3010/login?clientId=YDXyJy44OZHVxnKg3qMYh0Gv3knj' })
    @IsString()
    @IsNotEmpty()
    url: string;
}

export class ResponseCheckAuthDto extends CheckAuthDto {}
