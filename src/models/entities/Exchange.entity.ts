import { Schema, SchemaFactory } from '@nestjs/mongoose';

import { Prop } from '@shared/swagger';
import { EExchangeStatus, EExchangeType, EUserStatusInExchange } from '@constants/exchange.constant';
import { BaseDocument, BaseEntity } from '@shared/api/models/base.entity';
import { IHighestBidderInfo, ISellerInfo } from '@modules/exchange/interface';

export type ExchangeDocument = Exchange & BaseDocument;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class Exchange extends BaseEntity {
    @Prop({ required: true, enum: Object.values(EExchangeType) })
    type: EExchangeType;

    @Prop({ required: true })
    sellerId: string;

    @Prop({ required: false })
    buyerId: string;

    @Prop({ required: true })
    nftId: number;

    @Prop({ required: true })
    nftAddress: string;

    @Prop({ required: true })
    erc20Address: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: false })
    auctionStartAt: number;

    @Prop({ required: false })
    auctionEndAt: number;

    @Prop({ required: true, enum: Object.values(EExchangeStatus) })
    status: EExchangeStatus;

    @Prop({ required: false })
    created_at: Date;

    @Prop({ required: false })
    updated_at: Date;

    @Prop({ required: false, enum: Object.values(EUserStatusInExchange) })
    userStatus: EUserStatusInExchange;

    @Prop({ required: false, type: Object })
    highestBidInfo: IHighestBidderInfo;

    @Prop({ required: false, type: Object })
    sellerInfo: ISellerInfo;
}

export const ExchangeSchema = SchemaFactory.createForClass(Exchange);
