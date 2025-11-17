import { Injectable } from "@nestjs/common";
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
			},
			order: { createdAt: "DESC" },
			skip: (query.page - 1) * query.limit,
			take: query.limit,
		});

		return [entities, count];
	}

	async findOne(id: string) {
		const userId = this.cls.get("profile").id;

		const existingCodeblock = await this.repo.findOne({
			where: {
				id,
				userId,
				deletedAt: null,
			},
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
