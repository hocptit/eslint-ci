import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
    @ApiProperty({ example: 'qWpxnl3EgQuYl3QNqW0wsLKwzGo' })
    @IsString()
    @IsNotEmpty()
    clientId: string;
}

export class RequestVerifyDto extends VerifyDto {}
