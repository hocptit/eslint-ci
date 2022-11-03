import { isDevelopmentEnv } from '@constants/env.constant';

export const fortressApi = {
    auth: '/oauth/token',
    wallet: '/api/wallet/v1/wallets',
    transaction: '/api/wallet/v1/wallet-transactions',
    nftBalance: '/api/wallet/v1/wallets/{walletId}/nft-balances',
    cryptoBalance: '/api/wallet/v1/wallets/{walletId}/crypto-balances',
    estimateGas: '/api/wallet/v1/wallets/{walletId}/withdraw-nft/estimate',
    withdraw: '/api/wallet/v1/wallets/{walletId}/withdraw-nft',
    token: '/api/wallet/v1/tokens',
    getWallet: '/api/wallet/v1/wallets/{walletId}',
    getTokenById: '/api/wallet/v1/tokens/{tokenId}',
    signTheTransaction: '/api/wallet/v1/wallets/{walletId}/sign-transaction',
    sendRawTransaction: '/api/wallet/v1/wallets/{walletId}/send-raw-transaction',
};

export enum FortressAsset {
    Eth = 'eth',
    Matic = 'matic',
    Btc = 'btc',
    Usdc = 'usdc',
    Flrns = 'flrns',
    Sol = 'sol',
    Weth = 'weth',
}

export enum FortressChain {
    Mainnet = 'mainnet',
    Ropsten = 'ropsten',
    Rinkeby = 'rinkeby',
    Goerli = 'goerli',
    Kovan = 'kovan',
    PolygonMainnet = 'polygonMainnet',
    BitcoinMainnet = 'bitcoinMainnet',
    BitcoinTestnet = 'bitcoinTestnet',
    SolanaMainnet = 'solanaMainnet',
    SolanaDevnet = 'solanaDevnet',
    SolanaTestnet = 'solanaTestnet',
    PolygonMumbai = 'polygonMumbai',
}

export const fortressDefaultNetwork = [
    {
        chain: isDevelopmentEnv() ? FortressChain.PolygonMumbai : FortressChain.PolygonMainnet,
        assetType: FortressAsset.Matic,
    },
];
