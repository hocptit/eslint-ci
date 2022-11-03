import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';
import { BaseEntity } from '@shared/api/models/base.entity';

export type WalletDocument = Wallet & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class Wallet extends BaseEntity {
    @Prop({ required: true, type: String })
    ownerId: string;

    @Prop({ required: false, type: String })
    fortressWalletId: string;

    @Prop({ required: false, type: String })
    fortressWalletAddress: string;

    @Prop({ required: false, type: String })
    circleWalletId: string;

    @Prop({ required: false, type: String })
    circleAddressOnPolygon: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
