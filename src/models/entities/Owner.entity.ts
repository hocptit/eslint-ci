import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Prop } from '@shared/swagger';
import { ICard } from '@modules/owner/interface';
import * as bcrypt from 'bcrypt';
import validator from 'validator';
import { EPreferredColor } from '@modules/owner/owner.constant';

export type OwnerDocument = Owner & Document;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    versionKey: false,
    virtuals: true,
})
export class Owner {
    @Prop({
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        validate: validator.isEmail,
    })
    email: string;

    @Prop({ type: String, required: true, select: false })
    password: string;

    @Prop({ type: String, required: true })
    firstName: string;

    @Prop({ type: String, required: true })
    lastName: string;

    @Prop({ type: String, require: false })
    phone?: string;

    @Prop({ type: String, require: false })
    avatar?: string;

    @Prop({
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        select: false,
    })
    verifyMailAttempts: number;

    @Prop({ type: Boolean, default: false })
    isMailVerified: boolean;

    @Prop({ type: Boolean, default: false })
    phoneVerified: boolean;

    @Prop({ type: String, required: false })
    facebookId?: string;

    @Prop({ type: Boolean, default: false })
    membershipPaid: boolean;

    @Prop({
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    })
    alias: string;

    @Prop({ type: String, required: true })
    country: string;

    @Prop({
        type: String,
        require: false,
        default: null,
    })
    club?: string;

    @Prop({ type: Boolean, default: false })
    completeMembershipEmailSent: boolean;

    @Prop({ type: [String], default: [] })
    hearedAboutUsPlatforms: string[];

    @Prop({ type: String, required: false })
    preferredColor?: EPreferredColor;

    @Prop({ type: String, required: false })
    walletId?: string;

    @Prop({ type: String, required: false })
    walletAddress?: string;

    @Prop({ type: [], default: [] })
    circleCardIds: ICard[];

    @Prop({ type: Boolean, default: false })
    isCompleteBuyNFT: boolean;

    @Prop({ type: String })
    circleActiveCardId?: string;

    @Prop({ type: Boolean, default: false })
    isAddedByAdmin: boolean;

    @Prop({ type: Boolean, default: false })
    fromLA: boolean;

    @Prop({ type: Boolean, default: false, required: false })
    hasInternalWallet?: boolean;

    @Prop({ type: Boolean, default: false, required: false })
    hasCircleWallet?: boolean;
}

export enum Role {
    Owner = 'owner',
}

export const OwnerSchema = SchemaFactory.createForClass(Owner);

OwnerSchema.pre('save', async function ownerPreSave() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified('phone')) {
        this.phone = this.phone.split(/\+1|-/).join('');
    }
    if (this.isModified('facebookId')) {
        this.isMailVerified = true;
    }
});

OwnerSchema.pre('findOneAndUpdate', async function ownerPreFindAndUpdate(this) {
    const update: any = { ...this.getUpdate() };
    if (update.password) {
        update.password = await bcrypt.hash(update.password, 10);
        this.setUpdate(update);
    }
});
