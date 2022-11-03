import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginParamDto {
    @ApiProperty({ required: false, example: 'qWpxnl3EgQuYl3QNqW0wsLKwzGo' })
    @IsString()
    callback: string;
}
