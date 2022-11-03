import { SchemaFactory } from '@nestjs/mongoose';

import { Prop } from '@shared/swagger';
import { BaseDocument, BaseEntity } from '@shared/api/models/base.entity';

export type TemplateDocument = Template & BaseDocument;

export class Template extends BaseEntity {
    @Prop({ default: '' })
    content: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
