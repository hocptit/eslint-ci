import { ApiProperty } from '@nestjs/swagger';

export class WithdrawCryptoDto {
    @ApiProperty({ example: 8 })
    amount: number;

    @ApiProperty({ example: '0x9044f8d0A8F05654226EdeAE97e54bbf11fD232D' })
    walletAddress: string;
}
