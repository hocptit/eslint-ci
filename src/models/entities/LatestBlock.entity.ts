import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';

export type LatestBlockDocument = LatestBlock & Document;

export enum ELatestBlockKey {
    PROVIDER_CRAWLER_BLOCK_POLYGON = 'provider_crawler_block_polygon',
}

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class LatestBlock {
    @Prop({ required: true, type: String })
    key: string;

    @Prop({ required: false, type: Number })
    block: number;

    @Prop({ required: false, type: Number })
    blockPerProcess: number;

    @Prop({ required: false, type: Number, default: 2000 })
    sleepTime: number;
}

export const LatestBlockSchema = SchemaFactory.createForClass(LatestBlock);
