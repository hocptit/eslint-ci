import { Injectable } from '@nestjs/common';
import { UpdateOwnerDto } from '@modules/owner/dto/request/update-owner.dto';
import OwnerRepository from '@models/repositories/Owner.repository';
import { OwnerDocument } from '@models/entities/Owner.entity';
import { ICard, ICreateOwner, ILoginPayload, IUpdateOwner } from '@modules/owner/interface';
import { EUpdateCardType } from '@modules/owner/owner.constant';
import { BadRequestException } from '@shared/exception';
import { ErrorConstant } from '@constants/error.constant';
import * as bcrypt from 'bcrypt';
import { WalletService } from '@modules/wallet/wallet.service';

@Injectable()
export class OwnerService {
    constructor(private ownerRepository: OwnerRepository, private walletService: WalletService) {}

    async getOwner(id: string): Promise<OwnerDocument> {
        // Check if Current Owner isn't null
        if (!id)
            throw new BadRequestException({
                message: ErrorConstant.OWNER.CURRENT_USER_IS_NULL,
            });

        const owner = await this.ownerRepository.findById(id);
        // Check if owner isn't exist with that id
        if (!owner) {
            throw new BadRequestException({
                message: ErrorConstant.OWNER.OWNER_NOT_FOUND,
            });
        }
        return owner;
    }

    async updateOwnerByHttp(id: string, updateOwnerDto: UpdateOwnerDto): Promise<OwnerDocument> {
        // Check exist owner;
        await this.getOwner(id);
        // Check null, undefined updateOwnerDto
        if (!updateOwnerDto || Object.keys(updateOwnerDto).length === 0)
            throw new BadRequestException({
                message: ErrorConstant.OWNER.INVALID_INPUT_DATA,
            });

        // Check property's values is not empty string
        const isDataValid = Object.values(updateOwnerDto).every(x => {
            if (Array.isArray(x)) return x.some(item => item !== '');
            return x !== '';
        });
        if (!isDataValid) {
            throw new BadRequestException({
                message: ErrorConstant.OWNER.INVALID_INPUT_DATA,
            });
        }

        await this.ownerRepository.update(id, updateOwnerDto);
        return await this.getOwner(id);
    }

    async getOwnerByEmail(email: string): Promise<OwnerDocument> {
        const owner = await this.ownerRepository.findByEmail(email);
        if (!owner) {
            throw new BadRequestException({ message: ErrorConstant.OWNER.OWNER_NOT_FOUND });
        }
        return owner;
    }

    async getOwnerNotHasFortressWallet(): Promise<OwnerDocument[]> {
        const owners: OwnerDocument[] = await this.ownerRepository.findOwnerNotHasFortressWallet();
        return owners.length ? owners : [];
    }

    async findOwnerNotHasCircleWallet(): Promise<OwnerDocument[]> {
        const owners: OwnerDocument[] = await this.ownerRepository.findOwnerNotHasCircleWallet();
        return owners.length ? owners : [];
    }

    async updateOwner(id: string, updateOwner: IUpdateOwner): Promise<OwnerDocument> {
        // Check exist owner;
        await this.getOwner(id);

        const updateData = updateOwner;
        // Check if list cards needs to be updated (delete card, add card)
        if (updateOwner?.isUpdateCards) {
            const { updateCardType, cardTarget } = updateOwner;
            // Check if enough data to add or delete special card
            if (!updateCardType || !cardTarget)
                throw new BadRequestException({
                    message: ErrorConstant.OWNER.NOT_ENOUGH_DATA_UPDATE_CARD,
                });

            const owner: OwnerDocument = await this.getOwner(id);
            const oldListCards: ICard[] = owner.circleCardIds;

            // Check can add/ delete card
            const isExistCard = oldListCards.find(card => card.cardId === cardTarget.cardId);

            if (isExistCard && updateCardType === EUpdateCardType.ADD)
                throw new BadRequestException({
                    message: ErrorConstant.OWNER.EXISTED_CARD,
                });
            if (!isExistCard && updateCardType === EUpdateCardType.DELETE)
                throw new BadRequestException({
                    message: ErrorConstant.OWNER.NOT_EXISTED_CARD,
                });

            // Add card / Delete card
            let newListCards: ICard[];
            if (updateCardType === EUpdateCardType.ADD) newListCards = [...oldListCards, cardTarget];
            if (updateCardType === EUpdateCardType.DELETE)
                newListCards = oldListCards.filter((card: ICard) => card.cardId !== cardTarget.cardId);

            updateData['circleCardIds'] = newListCards;
        }

        // Update data
        await this.ownerRepository.update(id, updateData);
        const afterUpdatedOwner: OwnerDocument = await this.getOwner(id);
        if (!afterUpdatedOwner)
            throw new BadRequestException({
                message: ErrorConstant.OWNER.CANT_UPDATE_BECAUSE_INVALID_INPUT_DATA,
            });
        return afterUpdatedOwner;
    }

    async createOwner(createOwner: ICreateOwner): Promise<OwnerDocument> {
        // Check exist owner with that alias
        const ownerWithAlias = await this.ownerRepository.findByAlias(createOwner.alias);
        if (ownerWithAlias)
            throw new BadRequestException({
                message: ErrorConstant.OWNER.EXISTED_OWNER_WITH_THAT_ALIAS,
            });

        // Check exist owner with that email
        const ownerWithEmail = await this.ownerRepository.findByEmail(createOwner.email);
        if (ownerWithEmail)
            throw new BadRequestException({
                message: ErrorConstant.OWNER.EXISTED_OWNER_WITH_THAT_EMAIL,
            });

        const owner: OwnerDocument = await this.ownerRepository.create(createOwner).then(owner => {
            owner = owner.toObject();
            delete owner.password;
            return owner;
        });

        if (!owner)
            throw new BadRequestException({
                message: ErrorConstant.OWNER.CANT_CREATE_BECAUSE_INVALID_INPUT_DATA,
            });
        delete owner.password;

        // Create wallet
        await this.walletService.createOwnerWallet({ ownerId: owner._id });
        return owner;
    }

    async verifyOwner(loginPayload: ILoginPayload): Promise<OwnerDocument> {
        const { email, password } = loginPayload;
        let owner = await this.ownerRepository.ownerDocumentModel.findOne({ email: email }).select('+password').exec();

        if (!owner) {
            throw new BadRequestException({ message: ErrorConstant.OWNER.INVALID_EMAIL_OR_PASSWORD });
        }

        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) {
            throw new BadRequestException({
                message: ErrorConstant.OWNER.INVALID_EMAIL_OR_PASSWORD,
            });
        }
        owner = owner.toObject();
        delete owner.password;
        return owner;
    }
}
