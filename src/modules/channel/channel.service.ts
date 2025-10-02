import { Injectable } from "@nestjs/common";
import { CreateChannelRequest, UpdateChannelRequest } from "./dto";
import { ChannelRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { ChannelExistedError, ChannelNotExistedError } from "./errors";

@Injectable()
export class ChannelService {
	constructor(
		private readonly channelRepo: ChannelRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async checkForExistedChannel(
		dto: CreateChannelRequest | UpdateChannelRequest,
		id?: string,
	) {
		const existedChannel = await this.channelRepo.findOne({
			where: { name: dto.name, groupId: this.cls.get("group").id },
		});
		if (existedChannel && existedChannel.id !== id)
			throw new ChannelExistedError();
	}

	async createOne(dto: CreateChannelRequest) {
		await this.checkForExistedChannel(dto);

		const createdBy = this.cls.get("profile").id;
		const groupId = this.cls.get("group").id;
		const channelEntity = this.channelRepo.create({
			name: dto.name,
			description: dto.description ?? null,
			groupId: groupId,
			createdBy: createdBy,
		});
		return await this.channelRepo.insert(channelEntity);
	}

	async updateOne(id: string, dto: UpdateChannelRequest) {
		await Promise.all([this.findOne(id), this.checkForExistedChannel(dto, id)]);

		return await this.channelRepo.update(id, {
			name: dto.name,
			description: dto.description ?? null,
		});
	}

	async findMany() {
		return this.channelRepo.find({
			order: { createdAt: "DESC" },
			where: { groupId: this.cls.get("group").id },
		});
	}

	async findOne(id: string) {
		const channel = await this.channelRepo.findOne({
			where: { id: id, groupId: this.cls.get("group").id },
		});
		if (!channel) throw new ChannelNotExistedError();
		return channel;
	}

	async deleteOne(id: string) {
		await this.findOne(id);
		await this.channelRepo.delete(id);
	}
}
