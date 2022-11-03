import { EOrderStatus } from '@constants/exchange.constant';

export interface IExchangeType {
    SELL: string;
    AUCTION: string;
}

export interface IExchangeStatus {
    PENDING: string;
    DONE: string;
    CANCELED: string;
}

export interface IOrderType {
    BUY: string;
    BID: string;
}

export interface IOrderStatus {
    PENDING: string;
    WIN: string;
    LOSE: string;
    CANCELED: string;
}

export interface IHighestBidderInfo {
    userId: string;
    firstName: string;
    lastName: string;
    status: EOrderStatus;
}

export interface ISellerInfo {
    firstName: string;
    lastName: string;
}
