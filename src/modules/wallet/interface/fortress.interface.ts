import { FortressAsset, FortressChain } from '@constants/fortress.constant';

export type Asset = {
    chain: FortressChain;
    assetType: FortressAsset;
};

export interface IFortressAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export interface ICreateFortressWalletResponse {
    id: string;
    name: string;
    identityId?: string;
}

export interface IGetFortressWalletResponse {
    id: string;
    name: string;
    addresses: {
        network: string;
        assetType: string;
        address: string;
    }[];
}

export type CreateAddressWalletType = {
    name?: string;
    assets?: Asset[];
};

export interface IFortressTransferNft {
    walletId: string;
    tokenId: string;
    destinationWalletId: string;
    destinationAddress: string;
    amount: number;
    note?: string;
}

export interface IInputUpdateHasWallet {
    ownerId: string;
    updateOwner: {
        hasInternalWallet: boolean;
        walletId?: string;
        walletAddress?: string;
    };
}

export interface IFortressGasFee {
    gasPrice: number;
    gasLimit: number;
    networkFee: number;
    isBalanceEnoughForPayingFee: boolean;
}

export interface IFortressEstimateGasResponse {
    low: IFortressGasFee;
    medium: IFortressGasFee;
    high: IFortressGasFee;
}

export interface IFortressNftBalancesInWalletResponse {
    network: string;
    address: string;
    nftTokenBalances: {
        tokenId: string;
        amount: number;
        [key: string]: any;
    };
}

export enum EFortressTransaction {
    CRYPTO_DEPOSIT = 'cryptoDeposit',
    CRYPTO_WITHDRAWAL = 'cryptoWithdrawal',
    NFT_DEPOSIT = 'nftDeposit',
    NFT_WITHDRAWAL = 'nftWithdrawal',
    WALLET_CONNECT = 'walletConnect',
}

export interface IFortressWallet {
    walletId: string;
    address: string;
}

export interface IFortressToken {
    id: string;
    contractAddress: string;
    blockchainTokenId: string;
    name: string;
    description: string;
    network: string;
    collectionName: string;
    tokenType: string;
    createdAtUtc: string;
    metadata: any;
    files: any[];
}

export enum EFortressTransactionStatus {
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export interface IFortressTransferNftResponse {
    id: string;
    type: EFortressTransaction;
    source: IFortressWallet;
    destination: IFortressWallet;
    network: string;
    assetType: string;
    token: IFortressToken;
    amount: number;
    nftAmount: number;
    gasPrice: string;
    gasLimit: string;
    networkFee: string;
    status: EFortressTransactionStatus;
    note: string;
    failReason: string;
    createdAt: Date;
    signature: string;
    rawTx: string;
}

export interface IFortressGetCryptoBalanceResponse {
    data: {
        network: FortressChain;
        assetType: FortressAsset;
        address: string;
        totalBalance: number;
    }[];
}

export interface IFortressSignTransactionInput {
    addressFrom: string;
    addressTo: string;
    data: string;
    // gas limit
    gas: string;
    gasPrice: string;
    value: string;
}

export interface IFortressSignTransactionResponse {
    signedMessage: string;
}

export interface IFortressSendRawTxInput {
    signedTransactionData: string;
}

export interface IFortressSendRawTxResponse {
    transactionHash: string;
}
