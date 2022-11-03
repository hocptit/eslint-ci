import { PreferredColor } from './auth.enum';

export interface Card {
    keyId: string;
    cardId: string;
}

export interface IOwner {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    verifyMailAttempts: number;
    isMailVerified: boolean;
    phoneVerified: boolean;
    facebookId?: string;
    membershipPaid: boolean;
    alias: string;
    country: string;
    club?: string;
    completeMembershipEmailSent: boolean;
    hearedAboutUsPlatforms: string[];
    preferredColor?: PreferredColor;
    walletId?: string;
    walletAddress?: string;
    circleCardIds?: Card[];
    isCompleteBuyNFT: boolean;
    circleActiveCardId?: string;
    isAddedByAdmin: boolean;
    fromLA: boolean;
    hasInternalWallet?: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IJWTToken {
    token: string;
    ttl: string;
    userId: string;
}
