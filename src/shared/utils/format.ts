import { IResponse } from '@shared/interceptors/request-response.interceptor';
import mongoose from 'mongoose';
import moment from 'moment';
export interface IPaginationMetadata {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
}

export function formatResponseSuccess<T>(response: IResponse<T>) {
    return response;
}

export function formatMongoosePagination<T>(paginateResult: mongoose.PaginateResult<T>): {
    data: T[];
    _metadata: IPaginationMetadata;
} {
    const { docs, totalDocs, limit, page, totalPages } = paginateResult;
    return {
        data: docs,
        _metadata: {
            totalDocs: totalDocs,
            totalPages: totalPages,
            page,
            limit,
        },
    };
}

export function getUnixTimestamp(date = new Date()) {
    return moment(date).unix();
}
