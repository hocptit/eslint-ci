import { SsoToken, SsoTokenDocument } from '@models/entities/SsoToken.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export default class SsoTokenRepository {
    constructor(@InjectModel(SsoToken.name) public ssoTokenModel: Model<SsoTokenDocument>) {}
}
