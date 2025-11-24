import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from "@nestjs/common";
import {
	CreateUserLanguageCollectionRequest,
	UpdateUserLanguageCollectionRequest,
} from "./dto";
import { UserLanguageCollectionRepository } from "@db/repositories";
import { UserLanguageCollectionEntity } from "@db/entities";
import { DevChatCls, PaginationDto } from "@utils";
import { ClsService } from "nestjs-cls";

interface ListResult<T> {
	data: T[];
	pagination: PaginationDto;
}

@Injectable()
export class UserLanguageCollectionService {
	constructor(
		private readonly repo: UserLanguageCollectionRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	private getCurrentUserId(): string {
		return this.cls.get("profile.id");
	}

	async createOne(
		dto: CreateUserLanguageCollectionRequest,
	): Promise<UserLanguageCollectionEntity> {
		// Prevent duplicate entries for same user & language
		const existing = await this.repo.findOne({
			where: { userId: dto.userId, languageId: dto.languageId },
		});
		if (existing) {
			throw new BadRequestException(
				"Language already exists in user's collection",
			);
		}

		const lastEntry = await this.repo.findOne({
			where: { userId: dto.userId },
			order: { orderIndex: "DESC" },
		});

		const nextOrderIndex = lastEntry ? lastEntry.orderIndex + 1 : 1;
		const entity = this.repo.create({
			userId: dto.userId,
			languageId: dto.languageId,
			proficiencyLevel: dto.proficiencyLevel,
			orderIndex: nextOrderIndex,
			createdBy: this.getCurrentUserId(),
			updatedBy: this.getCurrentUserId(),
		});
		return this.repo.save(entity);
	}

	async updateOne(
		id: string,
		dto: UpdateUserLanguageCollectionRequest,
	): Promise<UserLanguageCollectionEntity> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity)
			throw new NotFoundException("User language collection entry not found");

		const currentUserId = entity.userId;
		const targetUserId = dto.userId ?? currentUserId;
		const currentOrderIndex = entity.orderIndex;
		const newOrderIndexProvided =
			dto.orderIndex !== undefined && dto.orderIndex !== null;
		const requestedOrderIndex = dto.orderIndex ?? currentOrderIndex;

		// Duplicate language validation (consider potential userId change)
		if (dto.languageId && dto.languageId !== entity.languageId) {
			const dup = await this.repo.findOne({
				where: { userId: targetUserId, languageId: dto.languageId },
			});
			if (dup)
				throw new BadRequestException(
					"Language already exists in user's collection",
				);
		}

		// Apply basic field updates first (except orderIndex which we may recompute)
		entity.userId = targetUserId;
		entity.languageId = dto.languageId ?? entity.languageId;
		entity.proficiencyLevel = dto.proficiencyLevel ?? entity.proficiencyLevel;
		entity.updatedBy = this.getCurrentUserId();

		// Reordering logic if userId changed OR orderIndex changed
		if (
			targetUserId !== currentUserId ||
			(newOrderIndexProvided && requestedOrderIndex !== currentOrderIndex)
		) {
			// Fetch all other items for target user (exclude this entity if still present)
			let siblings = await this.repo.find({
				where: { userId: targetUserId },
				order: { orderIndex: "ASC" },
			});
			// Remove current entity if it's in siblings set (moving within same user)
			siblings = siblings.filter((s) => s.id !== entity.id);

			// Determine insertion index
			const maxIndex = siblings.length + 1; // position count after including entity
			let newIndex = requestedOrderIndex;
			if (newIndex < 1) newIndex = 1;
			if (newIndex > maxIndex) newIndex = maxIndex;

			// If userId changed and no explicit orderIndex provided, append at end
			if (targetUserId !== currentUserId && !newOrderIndexProvided) {
				newIndex = maxIndex; // append
			}

			// Insert entity at new position
			const before = siblings.slice(0, newIndex - 1);
			const after = siblings.slice(newIndex - 1);
			const reordered = [...before, entity, ...after];

			// Reassign sequential orderIndex starting at 1
			reordered.forEach((item, idx) => {
				item.orderIndex = idx + 1;
				item.updatedBy = this.getCurrentUserId();
			});

			await this.repo.save(reordered);
		} else {
			// No reorder; preserve existing order index
			entity.orderIndex = currentOrderIndex;
			await this.repo.save(entity);
		}

		return entity;
	}

	async deleteOne(id: string): Promise<void> {
		const entity = await this.repo.findOne({
			where: { id, createdBy: this.getCurrentUserId() },
		});
		if (!entity)
			throw new NotFoundException("User language collection entry not found");
		await this.repo.remove(entity);
	}
}
