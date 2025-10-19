import { Injectable } from "@nestjs/common";
import {
	CreateCodeBlockRequest,
	UpdateCodeBlockRequest,
	CodeBlockQuery,
} from "./dto";
import { CodeBlockRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { FindOptionsWhere } from "typeorm";
import { CodeBlockEntity } from "@db/entities";
import { CodeBlockNotFound } from "./errors/code-block-not-found.error";

@Injectable()
export class CodeBlockService {
	constructor(
		private readonly repo: CodeBlockRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}
	async createOne(dto: CreateCodeBlockRequest) {
		const userId = this.cls.get("profile").id;
		const codeBlock = this.repo.create({
			userId,
			...dto,
		});

		await this.repo.insert(codeBlock);
		return await this.repo.findOne({
			where: { id: codeBlock.id },
			relations: ["user"],
		});
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

	async findMany(query: CodeBlockQuery) {
		const { page, limit, language } = query;
		const userId = this.cls.get("profile").id;
		const where: FindOptionsWhere<CodeBlockEntity> = {
			userId,
		};
		if (language) {
			where.language = language;
		}

		const [data, total] = await this.repo.findAndCount({
			where,
			skip: (page - 1) * limit,
			take: limit,
			relations: ["user"],
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
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
