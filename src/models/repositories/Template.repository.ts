import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Template, TemplateDocument } from '../entities/Template.entity';

@Injectable()
export default class TemplateRepository {
    constructor(@InjectModel(Template.name) public templateDocumentModel: Model<TemplateDocument>) {}
    findTemplate(id: string): Promise<TemplateDocument> {
        return this.templateDocumentModel.findOne({ _id: id }).exec();
    }
}
