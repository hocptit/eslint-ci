export enum EExchangeType {
    SELL = 'SELL',
    AUCTION = 'AUCTION',
}

export enum EExchangeStatus {
    PENDING_TRANSACTION = 'PENDING_TRANSACTION',
    OPEN = 'OPEN',
    ENDED = 'ENDED',
    HANDLING_AUCTION = 'HANDLING_AUCTION',
}

export enum EOrderType {
    BUY = 'BUY',
    BID = 'BID',
}

export enum EOrderStatus {
    WAITING_SETTLE = 'WAITING_SETTLE',
    PENDING_TRANSACTION = 'PENDING_TRANSACTION',
    WIN = 'WIN',
    LOSE = 'LOSE',
    CANCELED = 'CANCELED',
}

export enum EPaginationDirection {
    ASC = 'asc',
    DESC = 'desc',
}

export enum EPaginationSortBy {
    NFT_ID = 'nftId',
    PRICE = 'price',
    AUCTION_END_AT = 'auctionEndAt',
    CURRENT_BID = 'currentBid',
    UPDATED_AT = 'updated_at',
    CREATED_AT = 'created_at',
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

export enum EUserStatusInExchange {
    HIGHEST_BIDDER = 'highestBidder',
    WINNER = 'winner',
    LOSER = 'loser',
    NOT_PARTICIPATED = 'notParticipated',
    OUT_BID = 'outBid',
}
