import { SetMetadata } from '@nestjs/common';
import { Role } from '@models/entities/Owner.entity';

export const ROLES_KEY = 'role';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
