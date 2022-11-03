import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EAuthGuard, IS_PUBLIC_KEY } from '@constants/auth.constant';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard(EAuthGuard.JWT) {
    constructor(private reflector: Reflector) {
        super();
    }
    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;
        return super.canActivate(context);
    }

    handleRequest(err: Error, user, info) {
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user || info) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}

@Injectable()
export class JwtGetUser extends AuthGuard([EAuthGuard.JWT]) {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user) {
        return user;
    }
}
