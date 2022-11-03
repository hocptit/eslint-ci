import { AuthToken, AuthTokenDocument } from '@models/entities/AuthToken.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export default class AuthTokenRepository {
    constructor(@InjectModel(AuthToken.name) public authTokenModel: Model<AuthTokenDocument>) {}
}
