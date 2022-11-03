import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckAuthDto {
    @ApiProperty({ required: false, example: 'qWpxnl3EgQuYl3QNqW0wsLKwzGo' })
    @IsString()
    @IsNotEmpty()
    callback: string;
}

export class ResquestCheckAuthDto extends CheckAuthDto {}
