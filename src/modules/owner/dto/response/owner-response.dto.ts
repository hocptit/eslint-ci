import { ApiPropertyOptional } from '@nestjs/swagger';
import { PreferredColor } from '@modules/auth/auth.enum';

export class CardDto {
    @ApiPropertyOptional()
    keyId?: string;

    @ApiPropertyOptional()
    cardId?: string;
}

export class OwnerResponseDto {
    @ApiPropertyOptional({ example: '62f60914aa88494cfbf9b0cf' })
    _id: string;

    @ApiPropertyOptional({ example: 'hanh.luu+13@sotatek.com' })
    email: string;

    @ApiPropertyOptional({ example: 'Hanh' })
    firstName: string;

    @ApiPropertyOptional({ example: 'Hanh' })
    lastName: string;

    @ApiPropertyOptional({ example: '5634563456' })
    phone?: string;

    @ApiPropertyOptional({ example: 'Hana' })
    avatar?: string;

    @ApiPropertyOptional({ example: 2 })
    verifyMailAttempts: number;

    @ApiPropertyOptional({ example: true })
    isMailVerified: boolean;

    @ApiPropertyOptional({ example: false })
    phoneVerified: boolean;

    @ApiPropertyOptional({ example: 'er3fergseg343452' })
    facebookId?: string;

    @ApiPropertyOptional({ example: false })
    membershipPaid: boolean;

    @ApiPropertyOptional({ example: 'Hanh' })
    alias: string;

    @ApiPropertyOptional({ example: 'US' })
    country: string;

    @ApiPropertyOptional({ example: 'test' })
    club?: string;

    @ApiPropertyOptional({ example: true })
    completeMembershipEmailSent: boolean;

    @ApiPropertyOptional({ example: ['facebook'] })
    hearedAboutUsPlatforms: string[];

    @ApiPropertyOptional({ example: PreferredColor.TidalBlack })
    preferredColor?: PreferredColor;

    @ApiPropertyOptional({ example: '9b68f5a4-fa8e-4429-a804-928cc83444c6' })
    walletId?: string;

    @ApiPropertyOptional({ example: '0x5253067aCA4bfF5a0c7d6D3106BbC3eb163f2FFA' })
    walletAddress?: string;

    @ApiPropertyOptional({ type: [CardDto], example: ['0x5253067aCA4bfF5a0c7d6D3106BbC3eb163345345'] })
    circleCardIds?: CardDto[];

    @ApiPropertyOptional({ example: true })
    isCompleteBuyNFT: boolean;

    @ApiPropertyOptional({ example: '0x5253067aCA4bfF5a0c7d6D3106BbC3eb163345345' })
    circleActiveCardId?: string;

    @ApiPropertyOptional({ example: false })
    isAddedByAdmin: boolean;

    @ApiPropertyOptional({ example: true })
    fromLA: boolean;

    @ApiPropertyOptional({ example: false })
    hasInternalWallet?: boolean;

    @ApiPropertyOptional({ example: new Date('2022-10-23T08:31:35.886Z') })
    created_at: Date;

    @ApiPropertyOptional({ example: new Date('2022-10-23T08:31:35.886Z') })
    updated_at: Date;
}
