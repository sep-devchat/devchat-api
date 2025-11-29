import { UserEntity } from "@db/entities";
import {
	CodeBlockRepository,
	CodeCollaborationRepository,
	UserRepository,
} from "@db/repositories";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CodeCollaborationSeederService {
	private readonly logger = new Logger(CodeCollaborationSeederService.name);
	private readonly maxCollaborations = 150;

	constructor(
		private readonly codeCollaborationRepo: CodeCollaborationRepository,
		private readonly codeBlockRepo: CodeBlockRepository,
		private readonly userRepo: UserRepository,
	) {}

	async run() {
		const [codeBlocks, existingCollaborations, users] = await Promise.all([
			this.codeBlockRepo.find({ take: 500 }),
			this.codeCollaborationRepo.find(),
			this.userRepo.find(),
		]);

		if (!codeBlocks.length) {
			this.logger.warn(
				"No code blocks available. Skipping code collaboration seeding.",
			);
			return;
		}

		if (!users.length) {
			this.logger.warn(
				"No users available. Skipping code collaboration seeding.",
			);
			return;
		}

		const existingBlockIds = new Set(
			existingCollaborations.map((collab) => collab.codeBlockId),
		);
		const availableBlocks = codeBlocks.filter(
			(block) => !existingBlockIds.has(block.id),
		);

		if (!availableBlocks.length) {
			this.logger.log(
				"Code collaborations already exist for available code blocks. Nothing to seed.",
			);
			return;
		}

		const sample = faker.helpers
			.shuffle(availableBlocks)
			.slice(0, Math.min(this.maxCollaborations, availableBlocks.length));

		const collaborations = sample.map((block) =>
			this.codeCollaborationRepo.create({
				codeBlockId: block.id,
				content: this.buildCollaborationNotes(block.language),
				createdById: this.pickCollaborator(users, block.userId).id,
			}),
		);

		await this.codeCollaborationRepo.save(collaborations);
		this.logger.log(
			`Seeded ${collaborations.length} code collaboration records.`,
		);
	}

	private pickCollaborator(users: UserEntity[], ownerId: string) {
		const eligible = users.filter((user) => user.id !== ownerId);
		return eligible.length
			? faker.helpers.arrayElement(eligible)
			: faker.helpers.arrayElement(users);
	}

	private buildCollaborationNotes(language?: string | null) {
		return [
			`Reviewed ${language ?? "the"} snippet for potential optimizations.`,
			faker.hacker.phrase(),
			faker.lorem.sentence(),
		].join(" ");
	}
}
