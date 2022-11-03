import { UrlCallBack, UrlCallBackDocument } from '@models/entities/UrlCallback.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export default class UrlCallBackRepository {
    constructor(@InjectModel(UrlCallBack.name) public urlCallBackModel: Model<UrlCallBackDocument>) {}
}
