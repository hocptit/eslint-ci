import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@shared/api/models/base.entity';

export enum ENotifyType {
    WITHDRAW = 'WITHDRAW',
    WIN_FIX_PRICE = 'WIN_FIX_PRICE',
    WIN_BID = 'WIN_BID',
    DEPOSIT = 'DEPOSIT',
}

export interface INotifyData {
    message?: string;
    ref?: string;
}

export class NotifyData implements INotifyData {
    @ApiPropertyOptional()
    message?: string;

    @ApiPropertyOptional({ description: 'Id record ref' })
    ref?: string;
}

export type NotifyDocument = Notify & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class Notify extends BaseEntity {
    @Prop({ type: String, required: true })
    ownerId: string;

    @Prop({ type: Object, required: true }, { type: NotifyData })
    data: INotifyData;

    @Prop({ required: true, default: ENotifyType.WITHDRAW }, { enum: ENotifyType })
    type: ENotifyType;

    @Prop({ type: Boolean, required: true, default: true })
    isRead: boolean;
}

export const NotifySchema = SchemaFactory.createForClass(Notify);
