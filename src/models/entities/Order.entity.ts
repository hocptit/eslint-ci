import { Prop as PropMongo, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { Prop } from '@shared/swagger';
import { EOrderStatus, EOrderType } from '@constants/exchange.constant';

export type OrderDocument = Order & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class Order {
    @Prop({ required: true, enum: Object.values(EOrderType) })
    type: EOrderType;

    @PropMongo({ required: true })
    exchangeId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    nftId: number;

    @Prop({ required: true })
    nftAddress: string;

    @Prop({ required: true })
    erc20Address: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true, enum: Object.values(EOrderStatus) })
    status: EOrderStatus;

    @Prop({ required: false })
    created_at: Date;

    @Prop({ required: false })
    updated_at: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
