import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';

export type UrlCallBackDocument = UrlCallBack & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class UrlCallBack {
    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    sessionId: string;
}

export const UrlCallBackSchema = SchemaFactory.createForClass(UrlCallBack);
