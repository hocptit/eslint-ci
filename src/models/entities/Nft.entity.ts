import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';
import { BaseEntity } from '@shared/api/models/base.entity';

export type NftDocument = Nft & Document;

export enum ENftStatus {
    OWNER = 'owner',
    AUCTION = 'auction',
    SELL = 'sell',
}

export class NftMetadata {
    name: string;
    description: string;
    image: string;
    edition: number;
    animation_url: string;
    attributes: any[];
}

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class Nft extends BaseEntity {
    @Prop({ required: true, type: Number })
    nftId: number;

    @Prop({ required: false, type: String })
    uri: string;

    @Prop({ required: false, type: NftMetadata })
    metadata: NftMetadata;

    @Prop({ required: false, type: String })
    owner: string;

    @Prop({ required: false, type: String })
    ownerId: string;

    @Prop({ required: false, enum: ENftStatus })
    status: ENftStatus;

    @Prop({ required: false, type: Number })
    price: number;

    @Prop({ required: false, type: Number })
    datePurchased: number;
}

export const NftSchema = SchemaFactory.createForClass(Nft);
