import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { DevChatCls, RunCodeTypeEnum } from "@utils";
import { CodeBlockService } from "@modules/code-block";
import {
	CodeCollaborationRepository,
	RunCodeCacheRepostiroy,
} from "@db/repositories";
import {
	CodeCollaborationQuery,
	CreateCodeCollaborationRequest,
	UpdateCodeCollaborationRequest,
} from "./dto";
import { CodeCollaborationNotFoundError } from "./errors";

@Injectable()
export class CodeCollaborationService {
	constructor(
		private readonly codeCollaborationRepo: CodeCollaborationRepository,
		private readonly cls: ClsService<DevChatCls>,
		private readonly codeBlockService: CodeBlockService,
		private readonly runCodeCacheRepo: RunCodeCacheRepostiroy,
	) {}

	async createOne(dto: CreateCodeCollaborationRequest) {
		const codeBlock = await this.codeBlockService.findOne(
			dto.codeBlockId,
			false,
		);
		await this.codeCollaborationRepo.insert({
			codeBlockId: codeBlock.id,
			content: dto.content,
			createdById: this.cls.get("profile.id"),
		});
	}

	async updateOne(id: string, dto: UpdateCodeCollaborationRequest) {
		const codeCollaboration = await this.findOne(id);

		await this.codeCollaborationRepo.update(codeCollaboration.id, {
			content: dto.content,
		});

		await this.runCodeCacheRepo.delete({
			targetId: codeCollaboration.id,
			runCodeType: RunCodeTypeEnum.CODE_COLLABORATION,
		});
	}

	async findMany(query: CodeCollaborationQuery) {
		return await this.codeCollaborationRepo.find({
			where: {
				codeBlockId: query.codeBlockId,
			},
			relations: {
				createdBy: true,
			},
			order: {
				createdAt: "DESC",
			},
		});
	}

	async findOne(id: string) {
		const codeCollaboration = await this.codeCollaborationRepo.findOne({
			where: {
				id: id,
				createdById: this.cls.get("profile.id"),
			},
		});
		if (!codeCollaboration) throw new CodeCollaborationNotFoundError();
		return codeCollaboration;
	}

	async deleteOne(id: string) {
		const codeCollaboration = await this.findOne(id);

		await this.codeCollaborationRepo.delete(codeCollaboration.id);

		await this.runCodeCacheRepo.delete({
			targetId: codeCollaboration.id,
			runCodeType: RunCodeTypeEnum.CODE_COLLABORATION,
		});
	}
}
