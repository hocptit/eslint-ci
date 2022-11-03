import { TemplateDocument } from '@models//entities/Template.entity';
import TemplateRepository from '@models/repositories/Template.repository';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorConstant } from '@constants/error.constant';

import { BadRequestException } from '@shared/exception';
import { formatResponseSuccess } from '@shared/utils/format';

import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplateService {
    constructor(private templateRepository: TemplateRepository) {}
    async create(createTemplateDto: CreateTemplateDto) {
        const template = await this.templateRepository.templateDocumentModel.create({
            content: createTemplateDto.content,
        });
        return formatResponseSuccess({
            data: template,
            statusCode: HttpStatus.CREATED,
        });
    }

    async findAll(): Promise<TemplateDocument[]> {
        return this.templateRepository.templateDocumentModel.find().exec();
    }

    findOne(id: number) {
        console.log(id);
        throw new BadRequestException({
            message: ErrorConstant.TEMPLATE.NOT_FOUND,
        });
    }

    update(id: string, updateTemplateDto: UpdateTemplateDto) {
        console.log(updateTemplateDto);
        return this.templateRepository.findTemplate(id);
    }

    remove(id: number) {
        return `This action removes a #${id} template`;
    }
}
