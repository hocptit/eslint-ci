import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';

export type SsoTokenDocument = SsoToken & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class SsoToken {
    @Prop({ required: true })
    token: string;

    @Prop({ required: true })
    redirectUrl: string;

    @Prop({ required: true })
    ownerEmail: string;
}

export const SsoTokenSchema = SchemaFactory.createForClass(SsoToken);
