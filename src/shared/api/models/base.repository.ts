import mongoose, { FilterQuery } from 'mongoose';
import { BaseDocument, BaseEntity } from '@shared/api/models/base.entity';
import { formatMongoosePagination, IPaginationMetadata } from '@shared/utils/format';
import { baseGetPaginationOptions } from '@shared/api/dto/pagination.dto';
import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseRepository<Entity extends BaseEntity, EntityDocument extends BaseDocument> {
    constructor(public baseDocumentModel: mongoose.PaginateModel<Entity, mongoose.PaginateModel<EntityDocument>>) {}

    _filters(filters: Partial<Entity>): FilterQuery<Entity> {
        const filterQuery = {};
        for (const filter of Object.keys(filters)) {
            filterQuery[filter] = filters[filter];
        }
        return filterQuery as FilterQuery<Entity>;
    }

    async listWithPagination(
        basePaginationDto: BasePaginationDto,
        filters: Partial<Entity>,
    ): Promise<{
        data: Entity[];
        _metadata: IPaginationMetadata;
    }> {
        const paginationOptions = baseGetPaginationOptions(basePaginationDto);
        const response: mongoose.PaginateResult<Entity> = await this.baseDocumentModel.paginate(
            {
                ...this._filters(filters),
            },
            { ...paginationOptions },
        );
        return formatMongoosePagination(response);
    }

    async listWithAggregatePagination(
        basePaginationDto: BasePaginationDto,
        aggregate: mongoose.Aggregate<Entity[]>,
    ): Promise<{
        data: Entity[];
        _metadata: IPaginationMetadata;
    }> {
        const paginationOptions = baseGetPaginationOptions(basePaginationDto);
        const response: mongoose.PaginateResult<Entity> = (this.baseDocumentModel as any).aggregatePaginate(
            aggregate,
            paginationOptions,
        );
        return formatMongoosePagination(response);
    }

    async create(entityData: Partial<Entity>): Promise<Entity> {
        return await this.baseDocumentModel.create(entityData);
    }
}
