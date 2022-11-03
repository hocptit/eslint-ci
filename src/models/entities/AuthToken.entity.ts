import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';

export type AuthTokenDocument = AuthToken & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class AuthToken {
    @Prop({ required: true })
    owner: string;

    @Prop({ required: true })
    token: string;

    @Prop({ required: true })
    ttl: string;
}

export const AuthTokenSchema = SchemaFactory.createForClass(AuthToken);
