import { BaseDocument, BaseEntity } from '@shared/api/models/base.entity';
import { ObjectIDDto } from '@shared/dto/ObjectID.dto';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@shared/api/models/base.repository';
import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { IPaginationMetadata } from '@shared/utils/format';
import { AbstractBaseApi } from '@shared/api/abstract-base.api';
import mongoose from 'mongoose';

@Injectable()
export class BaseApi<Entity extends BaseEntity, EntityDocument extends BaseDocument> extends AbstractBaseApi {
    constructor(public baseRepo: BaseRepository<Entity, EntityDocument>) {
        super();
    }

    parseDto<FilterDto extends BasePaginationDto>(filterDto: FilterDto): [BasePaginationDto, Partial<Entity>] {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sortBy, page, limit, direction, ...filters } = filterDto;
        return [{ sortBy, page, limit, direction }, filters as unknown as Entity];
    }

    parseFilterDto<FilterDto extends BasePaginationDto>(filterDto: FilterDto): [BasePaginationDto, Partial<FilterDto>] {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sortBy, page, limit, direction, ...filters } = filterDto;
        return [{ sortBy, page, limit, direction }, filters as unknown as Partial<FilterDto>];
    }

    async listWithPagination(
        basePaginationDto: BasePaginationDto,
        filters: Partial<Entity>,
    ): Promise<{
        data: Entity[];
        _metadata: IPaginationMetadata;
    }> {
        return this.baseRepo.listWithPagination(basePaginationDto, filters);
    }

    async listWithAggregatePagination(
        basePaginationDto: BasePaginationDto,
        aggregate: mongoose.Aggregate<Entity[]>,
    ): Promise<{
        data: Entity[];
        _metadata: IPaginationMetadata;
    }> {
        return this.baseRepo.listWithAggregatePagination(basePaginationDto, aggregate);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    async beforeCreate(entityData: Partial<Entity>): Promise<Partial<Entity>> {
        return entityData;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    async afterCreate(entityData: Partial<Entity>, entity: Entity): Promise<void> {}

    async create(entityData: Partial<Entity>): Promise<Entity> {
        const beforeCreate = await this.beforeCreate(entityData);
        const entity = await this.baseRepo.create(beforeCreate);
        await this.afterCreate(entityData, entity);
        return entity;
    }

    async normalize<T extends Entity>(entities: Entity[]): Promise<T> {
        return entities as unknown as T;
    }

    async getEntityById(_id: ObjectIDDto): Promise<Entity> {
        const entity = await this.baseRepo.baseDocumentModel.findById(_id);
        const normalize = this.normalize([entity]);
        return normalize[0];
    }

    async getEntity(filters: Partial<Entity>) {
        const entity = await this.baseRepo.baseDocumentModel.findOne(this.baseRepo._filters(filters));
        const normalize = this.normalize([entity]);
        return normalize[0];
    }

    async listEntities(filters: Partial<Entity>) {
        const entities = await this.baseRepo.baseDocumentModel.find(this.baseRepo._filters(filters));
        return this.normalize(entities);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    async beforeUpdate(entityData: Partial<Entity>): Promise<Partial<Entity>> {
        return entityData;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    async afterUpdate(entityData: Partial<Entity>, entity: Entity): Promise<void> {}

    async updateOne(filters: Partial<Entity>, entityData: Partial<Entity>): Promise<EntityDocument> {
        const beforeUpdate = await this.beforeUpdate(entityData);
        const entity = await this.baseRepo.baseDocumentModel.findOne(this.baseRepo._filters(filters));
        return entity.update(beforeUpdate, { new: true });
    }

    async delete(filters: Partial<Entity>) {
        const entity = await this.baseRepo.baseDocumentModel.findOne(this.baseRepo._filters(filters));
        return entity.deleteOne();
    }
}
