import { Injectable } from '@nestjs/common';
import { OwnerService } from '@modules/owner/owner.service';
import { UpdateOwnerDto } from '@modules/owner/dto/request/update-owner.dto';

@Injectable()
export class OwnerUsecase {
    constructor(private ownerService: OwnerService) {}

    getOwner(ownerId: string) {
        return this.ownerService.getOwner(ownerId);
    }

    updateOwner(ownerId: string, updateOwnerDto: UpdateOwnerDto) {
        return this.ownerService.updateOwnerByHttp(ownerId, updateOwnerDto);
    }
}
