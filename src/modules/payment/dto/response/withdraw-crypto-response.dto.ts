import { ApiProperty } from '@nestjs/swagger';

export class WithdrawCryptoResponseDto {
    @ApiProperty({ example: '635d0b3acd5ecf204747a411' })
    _id: string;

    @ApiProperty({ example: '634cb4e4a524f7743acd8782' })
    walletId: string;

    @ApiProperty({ example: '0x9044f8d0A8F05654226EdeAE97e54bbf11fD232D' })
    walletAddress: string;

    @ApiProperty({ example: 'wallet' })
    sourceType: string;

    @ApiProperty({ example: 'transfer_usdc' })
    action: string;

    @ApiProperty({ example: '20' })
    amount: string;

    @ApiProperty({ example: '0x436b649e0a20eecca25a025f73a518a33a89bab5b66bde9b6dbfb822ba0b77d7' })
    txHash: string;

    @ApiProperty({ example: 'success' })
    status: string;

    @ApiProperty({ example: '2022-10-29T11:15:06.919Z' })
    created_at: string;

    @ApiProperty({ example: '2022-10-29T11:15:17.539Z' })
    updated_at: string;
}
