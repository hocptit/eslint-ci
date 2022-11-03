import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
    @ApiProperty({
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzRiZDEzNzZiNTgzMTcyNTBlMzc0NmUiLCJlbWFpbCI6InBodWNoYWF1emFoYWhhMUBnbWFpbC5jb20iLCJ1c2VyVHlwZSI6Im93bmVyIiwiaXNNYWlsVmVyaWZpZWQiOmZhbHNlLCJraWQiOiJwaHVjaGFhdXphaGFoYTFAZ21haWwuY29tIiwiaWF0IjoxNjY2NTE5MzM0LCJleHAiOjE2NjY2MDU3MzR9.1dg4f9NzlUKWt6tS7aAt-SSHQB1K9knZqCpz2__xkGM',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: '86400000' })
    @IsString()
    @IsNotEmpty()
    ttl: string;

    @ApiProperty({ example: '634bd1376b58317250e3746e' })
    @IsString()
    @IsNotEmpty()
    userId: string;
}

export class ResponseVerifyDto extends VerifyDto {}
