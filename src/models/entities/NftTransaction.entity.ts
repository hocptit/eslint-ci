import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum EStatusNftTransfer {
    PROCESSING = 'processing',
    SUCCESS = 'success',
    FAILURE = 'failure',
}

export type NftTransactionDocument = NftTransaction & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class NftTransaction {
    @Prop({ type: String, required: true })
    sender: string;

    @Prop({ type: String, required: true })
    receiver: string;

    @Prop({ type: String, required: true })
    tokenId: string;

    @Prop({ required: true })
    status: EStatusNftTransfer;

    @Prop({ type: String, required: false })
    detail: string;
}

export const NftTransactionSchema = SchemaFactory.createForClass(NftTransaction);
