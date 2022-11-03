import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';

export type WireBankAccountDocument = WireBankAccount & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class WireBankAccount {
    @Prop({ type: String, required: true })
    ownerId: string;

    @Prop({ type: [], default: [] })
    bankAccountIds: string[];
}

export const WireBankAccountSchema = SchemaFactory.createForClass(WireBankAccount);
