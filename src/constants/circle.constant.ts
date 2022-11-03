export type BillingDetailType = {
    name: string;
    city: string;
    country: string;
    line1: string;
    line2: string;
    district: string;
    postalCode: string;
};

export type MetadataType = {
    email: string;
    phoneNumber?: string;
    sessionId: string;
    ipAddress?: string;
};

export type CreateCardType = {
    idempotencyKey: string;
    keyId?: string;
    encryptedData: string;
    billingDetails: BillingDetailType;
    expMonth: number;
    expYear: number;
    metadata: MetadataType;
};

export type CreatePaymentType = {
    idempotencyKey: string;
    metadata: MetadataType;
    amount?: {
        amount: string;
        currency: string;
    };
    source: {
        id: string;
        type: string;
    };
    encryptedData?: string;
    keyId?: string;
    verification?: string;
    isAcceptTermAndCondition?: boolean;
};

export type CreatePaymentIntentType = {
    amount: {
        amount?: string;
        currency: string;
    };
    paymentMethods: [
        {
            type: string;
            chain: string;
        },
    ];
    settlementCurrency: string;
    isAcceptTermAndCondition?: boolean;
};

export const CircleConfig = {
    circle: {
        api: {
            getPublicKey: '/v1/encryption/public',
            cards: '/v1/cards',
            payments: '/v1/payments',
            paymentIntents: '/v1/paymentIntents',
            notification: '/v1/notifications/subscriptions',
            bankWire: '/v1/banks/wires',
            createPayout: '/v1/payouts',
            getBalance: '/v1/businessAccount/balances',
            wallet: '/v1/wallets',
            transfers: '/v1/transfers',
            configuration: '/v1/configuration',
            walletAddressOnChain: function (walletId): string {
                return `v1/wallets/${walletId}/addresses`;
            },
        },
        card: {
            verifycation: 'cvv',
            keyId: 'key1',
        },
        walletAddressOnChain: {
            currency: 'USD',
            chain: 'MATIC',
        },
    },
};

export const CoinmarketcapConfig = {
    coinmarketcap: {
        api: {
            getTokenPrice: '/v2/cryptocurrency/quotes/latest',
        },
    },
};

export enum Currency {
    Usd = 'USD',
    Eth = 'ETH',
    Btc = 'BTC',
}

export enum CircleNotificationType {
    Settlements = 'settlements',
    Payments = 'payments',
    PaymentIntents = 'paymentIntents',
    Wire = 'wire',
    Transfers = 'transfers',
    Payout = 'payouts',
}

export enum CirclePaymentStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Failed = 'failed',
    Paid = 'paid',
    Complete = 'complete',
}

export enum CirclePaymentIntentStatus {
    Created = 'created',
    Pending = 'pending',
    Expired = 'expired',
    Complete = 'complete',
}

export enum CirclePayoutStatus {
    Pending = 'pending',
    Complete = 'complete',
    Failed = 'failed',
}

export enum CmcTokenId {
    ETH = '1027',
    BTC = '1',
}

export enum ESourceType {
    CIRCLE = 'circle',
    WALLET = 'wallet',
}

export enum EAction {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
    BUY = 'buy',
    SELL = 'sell',
    BID = 'bid',
    REFUND_BID = 'refundBid',
}

export enum EBalanceType {
    LOCK = 'lock',
    AVAILABLE = 'available',
    ALL = 'all',
}

export enum UpdateCardType {
    DELETE = 'Delete',
    ADD = 'Add',
}

export enum EAllCurrency {
    USD = 'USD',
    EUR = 'EUR',
    BTC = 'BTC',
    ETH = 'ETH',
    USDC = 'USDC',
}

export enum EPayoutCurrency {
    USD = 'USD',
    EUR = 'EUR',
}

export enum ETypePayout {
    WIRE = 'wire',
    SEN = 'sen',
}
export enum ECreateWireBankStatus {
    COMPLETE = 'complete',
    PENDING = 'pending',
    FAILED = 'failed',
}

export enum ETransferSourceType {
    Blockchain = 'blockchain',
}
