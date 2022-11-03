import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController } from '@modules/owner/owner.controller';
import { OwnerService } from '@modules/owner/owner.service';
import { Owner, OwnerSchema } from '@models/entities/Owner.entity';
import OwnerRepository from '@models/repositories/Owner.repository';
import { OwnerUsecase } from '@modules/owner/owner.usecase';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Owner.name,
                schema: OwnerSchema,
            },
        ]),
        forwardRef(() => WalletModule),
    ],
    controllers: [OwnerController],
    providers: [OwnerUsecase, OwnerService, OwnerRepository],
    exports: [OwnerService, OwnerRepository],
})
export class OwnerModule {}
