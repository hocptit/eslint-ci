import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '@constants/auth.constant';
import { ApiBearerAuth } from '@nestjs/swagger';

import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, JwtGetUser } from '@shared/guards/auth.guard';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';

export const PublicApi = () => SetMetadata(IS_PUBLIC_KEY, true);
export const CurrentUser = createParamDecorator((data: any, ctx: ExecutionContext): IPayloadUserJwt | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ? request.user : undefined;
});

/**
 * @description: Using in top of controller
 * @constructor
 */
export function UseAuthGuard() {
    return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}

/**
 * @description Using in function of controller, using with @CurrentUser()
 * @constructor
 */
export function UseSkipGuard() {
    return applyDecorators(UseGuards(JwtGetUser), PublicApi(), ApiBearerAuth());
}
