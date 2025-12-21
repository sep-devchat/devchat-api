import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { GroupSupportedProgrammingLanguageRepository } from "@db/repositories";
import { GroupSupportedProgrammingLanguageEntity } from "@db/entities";
import { GroupService } from "@modules/group";

@Injectable()
export class GroupSupportedProgrammingLanguageService {
	constructor(
		private readonly repo: GroupSupportedProgrammingLanguageRepository,
		private readonly groupService: GroupService,
	) {}

	private async assertGroupLanguageLimitAllowsNew(groupId: string, toAdd = 1) {
		const { currentSubscription } =
			await this.groupService.findSubscriptionsInGroup(groupId);
		const limit = Number(
			currentSubscription?.subscription?.programmingLanguageInGroups ?? 0,
		);

		// Convention: < 0 means unlimited.
		if (Number.isFinite(limit) && limit < 0) return;

		// No subscription (or missing subscription details) => treat as disallowed.
		if (!currentSubscription?.subscription) {
			throw new BadRequestException(
				"Missing group subscription; cannot add programming languages",
			);
		}

		// Convention: 0 means not allowed.
		if (!Number.isFinite(limit) || limit <= 0) {
			throw new BadRequestException(
				"Current subscription does not allow adding programming languages to the group",
			);
		}

		const currentActive = await this.repo.count({
			where: { groupId, isActive: true },
		});
		if (currentActive + toAdd > limit) {
			throw new BadRequestException(
				`Programming language limit reached for this group (max ${limit})`,
			);
		}
	}

	async addLanguageToGroup(
		groupId: string,
		supportedProgrammingLanguageId: string,
	): Promise<GroupSupportedProgrammingLanguageEntity> {
		const existing = await this.repo.findOne({
			where: { groupId, supportedProgrammingLanguageId },
		});
		if (existing) {
			throw new BadRequestException(
				"Programming language already exists in this group",
			);
		}

		await this.assertGroupLanguageLimitAllowsNew(groupId, 1);

		const entity = this.repo.create({
			groupId,
			supportedProgrammingLanguageId,
			isActive: true,
		});

		return this.repo.save(entity);
	}

	async listGroupLanguages(
		groupId: string,
	): Promise<GroupSupportedProgrammingLanguageEntity[]> {
		return this.repo.find({
			where: { groupId, isActive: true },
			relations: { supportedProgrammingLanguage: true },
			order: { supportedProgrammingLanguage: { languageName: "ASC" } },
		});
	}

	async removeLanguageFromGroup(
		groupId: string,
		supportedProgrammingLanguageId: string,
	): Promise<void> {
		const entity = await this.repo.findOne({
			where: { groupId, supportedProgrammingLanguageId },
		});
		if (!entity) {
			throw new NotFoundException(
				"Group programming language mapping not found",
			);
		}

		await this.repo.remove(entity);
	}
}
