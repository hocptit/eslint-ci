import { Template, TemplateSchema } from '@models//entities/Template.entity';
import TemplateRepository from '@models/repositories/Template.repository';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Template.name,
                schema: TemplateSchema,
            },
        ]),
    ],
    controllers: [TemplateController],
    providers: [TemplateService, TemplateRepository],
})
export class TemplateModule {}
