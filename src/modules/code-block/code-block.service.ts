import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { UpdateCodeBlockRequest, CodeBlockQuery } from "./dto";
import { CodeBlockRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { CodeBlockEntity } from "@db/entities";
import { CodeBlockNotFound } from "./errors/code-block-not-found.error";

@Injectable()
export class CodeBlockService {
	constructor(
		private readonly repo: CodeBlockRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	private getCurrentUserId(): string {
		const profile = this.cls.get("profile");
		if (!profile?.id) {
			throw new UnauthorizedException("Missing authenticated user context");
		}
		return profile.id;
	}

	private ensureValidTarget(targetUserId: string, currentUserId: string) {
		if (String(targetUserId) === String(currentUserId)) {
			throw new BadRequestException(
				"Cannot fetch direct message code blocks with yourself",
			);
		}
	}

	async updateOne(id: string, dto: UpdateCodeBlockRequest) {
		const existingCodeblock = await this.findOne(id);

		await this.repo.update(id, {
			...dto,
		});

		return await this.repo.findOne({
			where: { id },
			relations: ["user"],
		});
	}

	async findMany(query: CodeBlockQuery): Promise<[CodeBlockEntity[], number]> {
		const channelId = this.cls.get("channel.id");
		const [entities, count] = await this.repo.findAndCount({
			where: {
				channelId,
				deletedAt: null,
			},
			order: { createdAt: "DESC" },
			skip: (query.page - 1) * query.limit,
			take: query.limit,
			relations: ["user"],
		});

		return [entities, count];
	}

	async findManyForDirect(
		targetUserId: string,
		query: CodeBlockQuery,
	): Promise<[CodeBlockEntity[], number]> {
		const currentUserId = this.getCurrentUserId();
		this.ensureValidTarget(targetUserId, currentUserId);

		const qb = this.repo
			.createQueryBuilder("codeBlock")
			.leftJoinAndSelect("codeBlock.user", "user")
			.where("codeBlock.deletedAt IS NULL")
			.andWhere(
				"((codeBlock.userId = :currentUserId AND codeBlock.toUserId = :targetUserId) OR (codeBlock.userId = :targetUserId AND codeBlock.toUserId = :currentUserId))",
				{ currentUserId, targetUserId },
			)
			.orderBy("codeBlock.createdAt", "DESC")
			.skip((query.page - 1) * query.limit)
			.take(query.limit);

		return qb.getManyAndCount();
	}

	async findOne(id: string, isOwned: boolean = true) {
		const userId = this.cls.get("profile.id");

		const existingCodeblock = await this.repo.findOne({
			where: {
				id,
				deletedAt: null,
			},
			relations: ["user"],
		});

		if (
			!existingCodeblock ||
			(isOwned && existingCodeblock.userId !== userId)
		) {
			throw new CodeBlockNotFound();
		}

		return existingCodeblock;
	}

	async findOneForDirect(id: string, targetUserId: string) {
		const currentUserId = this.getCurrentUserId();
		this.ensureValidTarget(targetUserId, currentUserId);

		const existingCodeblock = await this.repo.findOne({
			where: [
				{
					id,
					userId: currentUserId,
					toUserId: targetUserId,
					deletedAt: null,
				},
				{
					id,
					userId: targetUserId,
					toUserId: currentUserId,
					deletedAt: null,
				},
			],
			relations: ["user"],
		});

		if (!existingCodeblock) {
			throw new CodeBlockNotFound();
		}

		return existingCodeblock;
	}

	async deleteOne(id: string) {
		const existingCodeblock = await this.findOne(id);

		existingCodeblock.deletedAt = new Date();

		await this.repo.save(existingCodeblock);
	}
}
