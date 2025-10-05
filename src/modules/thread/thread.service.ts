import { Injectable } from "@nestjs/common";
import { CreateThreadRequest, UpdateThreadRequest } from "./dto";
import { ThreadRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { ThreadExistedError, ThreadNotExistedError } from "./errors";

@Injectable()
export class ThreadService {
	constructor(
		private readonly threadRepo: ThreadRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	private async ensureUniqueName(
		name: string,
		channelId: string,
		excludeId?: string,
	) {
		const existing = await this.threadRepo.findOne({
			where: { name, channelId },
		});
		if (existing && existing.id !== excludeId) throw new ThreadExistedError();
	}

	async createOne(dto: CreateThreadRequest) {
		const createdBy = this.cls.get("profile").id;
		const channelId = this.cls.get("channel").id;

		await this.ensureUniqueName(dto.name, channelId);

		const entity = this.threadRepo.create({
			name: dto.name,
			description: dto.description ?? null,
			channelId,
			createdBy,
		});
		await this.threadRepo.insert(entity);
		return entity;
	}

	async updateOne(id: string, dto: UpdateThreadRequest) {
		const channelId = this.cls.get("channel").id;
		await this.findOne(id);
		await this.ensureUniqueName(dto.name, channelId, id);
		await this.threadRepo.update(id, {
			name: dto.name,
			description: dto.description ?? null,
		});
	}

	async findMany() {
		const channelId = this.cls.get("channel").id;
		return await this.threadRepo.find({
			where: { channelId },
			order: { createdAt: "DESC" },
		});
	}

	async findOne(id: string) {
		const channelId = this.cls.get("channel").id;
		const entity = await this.threadRepo.findOne({ where: { id, channelId } });
		if (!entity) throw new ThreadNotExistedError();
		return entity;
	}

	async deleteOne(id: string) {
		await this.findOne(id);
		await this.threadRepo.delete(id);
	}
}
