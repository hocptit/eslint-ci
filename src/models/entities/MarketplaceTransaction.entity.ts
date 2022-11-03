import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { Prop } from '@shared/swagger';
import { IInstruction } from '@modules/payment/interface';
import { WithdrawFiatDto } from '@modules/payment/dto/request/withdraw-fiat.dto';

export enum Status {
    Completed = 'COMPLETED',
    Processing = 'PROCESSING',
    Failed = 'FAILED',
    Canceled = 'CANCELED',
    NeedRefund = 'NEED_REFUND',
    Refunded = 'REFUNDED',
}

export enum Action {
    UpgradeToMember = 'UpgradeToMember',
    BuyNFT = 'BuyNFT',
    Deposit = 'Deposit',
    Withdraw = 'Withdraw',
    TransferFortressToCircle = 'TransferFortressToCircle',
    TransferCircleToFortress = 'TransferCircleToFortress',
}

export enum CurrencyType {
    Crypto = 'Crypto',
    Fiat = 'Fiat',
    Wire = 'wire',
}

export enum RoundType {
    LA = 'LA',
}

export enum PaymentType {
    Circle = 'circle',
    Sendwyre = 'sendWyre',
    Paypal = 'paypal',
    Fortress = 'fortress',
}

export enum ETransferType {
    WIRE = 'wire',
    CARD = 'card',
    CRYPTO = 'crypto',
}

//   export interface TransactionDocument extends Document {
//     owner: string;
//     action: Action;
//     status: Status;
//     orderId: string;
//     paymentType: PaymentType;
//     sessionId?: string;
//     createdAt: Date;
//     updatedAt: Date;
//     deletedAt: Date;
//     details: Object [];
//     currencyType: CurrencyType;
//     round?: RoundType;
//     isAcceptTermAndCondition?: Boolean;
//   }

export type MarketplaceTransactionDocument = MarketplaceTransaction & Document;

@Schema({
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
    versionKey: false,
    virtuals: true,
})
export class MarketplaceTransaction {
    @Prop({ default: '' })
    owner: string;

    @Prop({ default: '' })
    action: Action;

    @Prop({ default: '' })
    paymentType: PaymentType;

    @Prop()
    transferType: ETransferType;

    @Prop({ default: '' })
    orderId: string;

    @Prop({ default: Status.Processing, required: true })
    status: string;

    @Prop({ default: '' })
    sessionId: string;

    @Prop({ default: '' })
    previousSessionId: string;

    @Prop({ default: 0 })
    amount: number;

    @Prop({ default: '' })
    currency: string;

    @Prop({ default: [] })
    details: object[];

    @Prop({ default: '' })
    currencyType: CurrencyType;

    @Prop({ default: '' })
    round: RoundType;

    @Prop({ default: true })
    isAcceptTermAndCondition: boolean;

    @Prop({ type: Object, required: false })
    instruction: IInstruction;

    @Prop({ required: false })
    withdrawInput: WithdrawFiatDto;

    @Prop({ default: 0 })
    amountPaidForDepositWire: number;

    @Prop({ default: [] })
    createWireBankHistory: object[];

    @Prop({ required: false })
    txHash: string;

    @Prop({ default: false })
    prepareWithdrawStatus: boolean;

    @Prop({ default: [] })
    failReason: string[];
}

export const MarketplaceTransactionSchema = SchemaFactory.createForClass(MarketplaceTransaction);
