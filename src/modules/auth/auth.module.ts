import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthToken, AuthTokenSchema } from '@models/entities/AuthToken.entity';
import { SsoToken, SsoTokenSchema } from '@models/entities/SsoToken.entity';
import { UrlCallBack, UrlCallBackSchema } from '@models/entities/UrlCallback.entity';
import AuthTokenRepository from '@models/repositories/AuthToken.repository';
import SsoTokenRepository from '@models/repositories/SsoToken.repository';
import UrlCallBackRepository from '@models/repositories/UrlCalback.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthUsecase } from './auth.usecase';
import { OwnerService } from '@modules/owner/owner.service';
import OwnerRepository from '@models/repositories/Owner.repository';
import { Owner, OwnerSchema } from '@models/entities/Owner.entity';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: SsoToken.name,
                schema: SsoTokenSchema,
            },
            {
                name: UrlCallBack.name,
                schema: UrlCallBackSchema,
            },
            {
                name: AuthToken.name,
                schema: AuthTokenSchema,
            },
            {
                name: Owner.name,
                schema: OwnerSchema,
            },
        ]),
        forwardRef(() => WalletModule),
    ],
    providers: [
        AuthService,
        AuthUsecase,
        JwtService,
        OwnerService,
        SsoTokenRepository,
        UrlCallBackRepository,
        AuthTokenRepository,
        OwnerRepository,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
