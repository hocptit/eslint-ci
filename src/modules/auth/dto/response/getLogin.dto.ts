import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetLoginDto {
    @ApiProperty({ example: 'http://localhost:3000/login?callback=YDXyJy44OZHVxnKg3qMYh0Gv3knj' })
    @IsString()
    @IsNotEmpty()
    url: string;
}
