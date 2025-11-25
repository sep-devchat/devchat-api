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
import { DevChatCls } from "@utils";
import { ClsService } from "nestjs-cls";

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
		const currentUserId = this.getCurrentUserId();
		// Prevent duplicate entries for same user & language
		const existing = await this.repo.findOne({
			where: { userId: currentUserId, languageId: dto.languageId },
		});
		if (existing) {
			throw new BadRequestException(
				"Language already exists in user's collection",
			);
		}

		const lastEntry = await this.repo.findOne({
			where: { userId: currentUserId },
			order: { orderIndex: "DESC" },
		});

		const nextOrderIndex = lastEntry ? lastEntry.orderIndex + 1 : 1;
		const entity = this.repo.create({
			userId: currentUserId,
			languageId: dto.languageId,
			proficiencyLevel: dto.proficiencyLevel,
			orderIndex: nextOrderIndex,
			createdBy: currentUserId,
			updatedBy: currentUserId,
		});
		return this.repo.save(entity);
	}

	async updateOne(
		id: string,
		dto: UpdateUserLanguageCollectionRequest,
	): Promise<UserLanguageCollectionEntity> {
		const currentUserId = this.getCurrentUserId();
		const entity = await this.repo.findOne({
			where: { id, userId: currentUserId },
		});
		if (!entity)
			throw new NotFoundException("User language collection entry not found");

		const currentOrderIndex = entity.orderIndex;
		const newOrderIndexProvided =
			dto.orderIndex !== undefined && dto.orderIndex !== null;
		const requestedOrderIndex = dto.orderIndex ?? currentOrderIndex;

		// Duplicate language validation (consider potential userId change)
		if (dto.languageId && dto.languageId !== entity.languageId) {
			const dup = await this.repo.findOne({
				where: { userId: currentUserId, languageId: dto.languageId },
			});
			if (dup)
				throw new BadRequestException(
					"Language already exists in user's collection",
				);
		}

		// Apply basic field updates first (except orderIndex which we may recompute)
		entity.languageId = dto.languageId ?? entity.languageId;
		entity.proficiencyLevel = dto.proficiencyLevel ?? entity.proficiencyLevel;
		entity.updatedBy = currentUserId;

		// Reordering logic only when requested order changes
		if (newOrderIndexProvided && requestedOrderIndex !== currentOrderIndex) {
			let siblings = await this.repo.find({
				where: { userId: currentUserId },
				order: { orderIndex: "ASC" },
			});
			siblings = siblings.filter((s) => s.id !== entity.id);

			// Determine insertion index
			const maxIndex = siblings.length + 1; // position count after including entity
			let newIndex = requestedOrderIndex;
			if (newIndex < 1) newIndex = 1;
			if (newIndex > maxIndex) newIndex = maxIndex;

			// Insert entity at new position
			const before = siblings.slice(0, newIndex - 1);
			const after = siblings.slice(newIndex - 1);
			const reordered = [...before, entity, ...after];

			// Reassign sequential orderIndex starting at 1
			reordered.forEach((item, idx) => {
				item.orderIndex = idx + 1;
				item.updatedBy = currentUserId;
			});

			await this.repo.save(reordered);
			return entity;
		}

		entity.orderIndex = currentOrderIndex;
		await this.repo.save(entity);
		return entity;
	}

	async deleteOne(id: string): Promise<void> {
		const currentUserId = this.getCurrentUserId();
		const entity = await this.repo.findOne({
			where: { id, userId: currentUserId },
		});
		if (!entity)
			throw new NotFoundException("User language collection entry not found");
		await this.repo.remove(entity);
	}
}
