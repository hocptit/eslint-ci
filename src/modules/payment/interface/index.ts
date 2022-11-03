import {
    EAllCurrency,
    BillingDetailType,
    EAction,
    EBalanceType,
    ESourceType,
    EPayoutCurrency,
    ETypePayout,
} from '@constants/circle.constant';
import { Action, ETransferType, PaymentType } from '@models/entities/MarketplaceTransaction.entity';
import { WithdrawFiatDto } from '@modules/payment/dto/request/withdraw-fiat.dto';

export interface Card {
    keyId?: string;
    cardId?: string;
}

export interface IResGetOwnerBalanceMicroservice {
    _id: string;
    ownerId: string;
    fortressWalletId: string;
    fortressWalletAddress: string;
    balance: number;
    availableBalance: number;
    created_at: Date;
    updated_at: Date;
}

export interface IResUpdateOwnerBalanceMicroservice {
    ownerId: string;
    balance: number;
    availableBalance: number;
    source?: string;
    sourceType?: ESourceType;
    tokenId?: string;
    action: EAction;
    balanceType?: EBalanceType;
    amount: number;
}

export interface UpdateCard {
    isUpdateCards?: boolean;
    circleActiveCardId?: string;
    owner?: string;
    circleCardIds?: Card[];
}

export interface IAmount {
    amount: string;
    currency: EPayoutCurrency;
}

export interface IBankAddress {
    bankName: string;
    city: string;
    country: string;
    line1: string;
    line2: string;
    district: string;
}

// export interface ICreateWireBankAccount {
//     idempotencyKey: string;
//     accountNumber?: string;
//     routingNumber?: string;
//     iban?: string;
//     billingDetails: BillingDetailType;
//     bankAddress: IBankAddress;
// }

export interface ICreateWireBankAccountResult {
    data: {
        id: string;
        status: string;
        description: string;
        trackingRef: string;
        fingerprint: string;
        virtualAccountEnabled: boolean;
        billingDetails: BillingDetailType;
        bankAddress: IBankAddress;
        createDate: Date;
        updateDate: Date;
    };
}

export interface ICreatePayout {
    idempotencyKey: string;
    source: {
        type: string;
        id: string;
    };
    destination: {
        type: ETypePayout;
        id: string;
    };
    amount: IAmount;
    metadata: {
        beneficiaryEmail: string;
    };
}

export interface IGetBalanceResult {
    data: {
        available: [
            {
                amount: string;
                currency: EAllCurrency;
            },
        ];
        unsettled: [
            {
                amount: string;
                currency: EAllCurrency;
            },
        ];
    };
}

export interface ICreateWallet {
    idempotencyKey: string;
    description?: string;
}

export interface IPayloadCreateAddress {
    currency: string;
    chain: string;
    idempotencyKey: string;
}

export interface IWallet {
    walletId: string;
    entityId: string;
    type: string;
    description: string;
}

export interface ICreateWalletResponse {
    data: {
        walletId?: string;
        entityId?: string;
        type?: string;
        description?: string;
        balances?: { amount: number; currency: string }[];
        address?: string;
        currency?: string;
        chain?: string;
    };
}

export interface ITransfer {
    idempotencyKey: string;
    source: {
        type: 'wallet';
        id: string;
    };
    destination: {
        type: 'wallet';
        id: string;
    };
    amount: {
        currency: 'USD';
        amount: string;
    };
}

export interface IInstruction {
    trackingRef: string;
    beneficiary: {
        name: string;
        address1: string;
        address2: string;
    };
    beneficiaryBank: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        swiftCode: string;
        routingNumber: string;
        accountNumber: string;
        currency: string;
    };
}

export interface IMarketplaceTransactionType {
    action: Action;
    paymentType: PaymentType;
    transferType: ETransferType;
    previousSessionId?: string;
    withdrawInput?: WithdrawFiatDto;
}

export interface ICircleGetWalletResponse {
    data: {
        walletId: string;
        entityId: string;
        type: string;
        description: string;
        balances: {
            amount: string;
            currency: string;
        }[];
    };
}
