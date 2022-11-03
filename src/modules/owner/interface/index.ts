import { EPreferredColor, EUpdateCardType } from '@modules/owner/owner.constant';

export interface ICard {
    keyId?: string;
    cardId?: string;
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
    preferredColor?: EPreferredColor;
    walletId?: string;
    walletAddress?: string;
    circleCardIds?: ICard[];
    isCompleteBuyNFT: boolean;
    circleActiveCardId?: string;
    isAddedByAdmin: boolean;
    fromLA: boolean;
    hasInternalWallet?: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IUpdateOwner {
    isUpdateCards?: boolean;
    updateCardType?: EUpdateCardType;
    cardTarget?: ICard;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    facebookId?: string;
    alias?: string;
    country?: string;
    club?: string;
    hearedAboutUsPlatforms?: string[];
    preferredColor?: EPreferredColor;
    fromLA?: boolean;
    verifyMailAttempts?: number;
    isMailVerified?: boolean;
    phoneVerified?: boolean;
    membershipPaid?: boolean;
    completeMembershipEmailSent?: boolean;
    walletId?: string;
    walletAddress?: string;
    isCompleteBuyNFT?: boolean;
    circleActiveCardId?: string;
    isAddedByAdmin?: boolean;
    hasInternalWallet?: boolean;
    hasCircleWallet?: boolean;
}

export interface ICreateOwner {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    alias: string;
    country: string;
    phone?: string;
    avatar?: string;
    facebookId?: string;
    hearedAboutUsPlatforms?: string[];
    preferredColor?: EPreferredColor;
}

export interface ILoginPayload {
    email: string;
    password: string;
}

export interface ICreateOwnerWallet {
    ownerId: string;
    fortressWalletId?: string;
    fortressWalletAddress?: string;
    balance: number;
    availableBalance: number;
}

export interface IWallet {
    _id: string;
    ownerId: string;
    fortressWalletId?: string;
    fortressWalletAddress?: string;
    balance: number;
    availableBalance: number;
}
