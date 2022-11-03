import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseEntity } from '@shared/api/models/base.entity';
import { Prop } from '@shared/swagger';

export enum ESourceType {
    CIRCLE = 'circle',
    FORTRESS = 'wallet',
    EXCHANGE_CONTRACT = 'exchange_contract',
}

export enum EAction {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
    BUY = 'buy',
    SELL_FIXED = 'sell_fixed',
    BID = 'bid',
    SELL_AUCTION = 'sell_auction',
    REFUND_BID = 'refundBid',

    APPROVE_USDC = 'approve_usdc',
    APPROVE_NFT = 'approve_nft',
    TRANSFER_USDC = 'transfer_usdc',
}

export enum EStatusTransaction {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
}

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class WalletTransaction extends BaseEntity {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet' })
    walletId: string;

    @Prop({ required: false, type: String })
    sourceType: ESourceType;

    @Prop({ required: false, type: String })
    nftId: string;

    @Prop({ required: true, type: String })
    action: EAction;

    @Prop({ required: false, type: String })
    amount: string;

    @Prop({ required: false, type: String })
    txHash: string;

    @Prop({ required: false, type: String })
    status: EStatusTransaction;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
