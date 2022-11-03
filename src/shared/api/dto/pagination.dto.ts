import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SortDto {
    @ApiPropertyOptional({ enum: ['create_at'] })
    @IsEnum(['create_at'])
    @IsOptional()
    sortBy?: string;
    @ApiPropertyOptional({ enum: ['desc', 'asc'] })
    @IsEnum(['desc', 'asc'])
    @IsOptional()
    direction?: 'desc' | 'asc';
}
export class PaginationDto extends SortDto {
    @Min(1)
    @IsInt()
    @IsOptional()
    @ApiProperty({ required: false })
    limit?: number;

    @Min(1)
    @IsInt()
    @IsOptional()
    @ApiProperty({ required: false })
    page?: number;
}
export const baseGetPaginationOptions = ({
    limit = 5,
    page = 1,
    sortBy = 'create_at',
    direction = 'desc',
}: PaginationDto) => {
    return {
        sort: { [sortBy]: direction === 'asc' ? 1 : -1 },
        limit,
        page,
    };
};

export const getPaginationOptions = (
    { limit = 10, page = 1 }: PaginationDto,
    sort: { sortBy: string; direction: string },
) => ({
    sort: { [sort.sortBy]: sort.direction === 'asc' ? 1 : -1 },
    limit,
    page,
});
