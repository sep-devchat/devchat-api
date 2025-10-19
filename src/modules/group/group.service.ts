import { Injectable } from "@nestjs/common";
import { CreateGroupRequest, UpdateGroupRequest } from "./dto";
import { GroupNotExistedError } from "./errors";
import { DevChatCls } from "@utils";
import { ClsService } from "nestjs-cls";
import { ChannelRepository, GroupRepository } from "@db/repositories";
import { Transactional } from "typeorm-transactional";

@Injectable()
export class GroupService {
	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	@Transactional()
	async createOne(dto: CreateGroupRequest) {
		const createdBy = this.cls.get("profile").id;
		const group = this.groupRepo.create({
			name: dto.name,
			avatar: dto.avatar ?? null,
			description: dto.description ?? null,
			createdBy,
		});

		const insertResult = await this.groupRepo.insert(group);
		await this.channelRepo.insert({
			name: "welcome",
			description: "Welcome channel",
			createdBy: createdBy,
			groupId: insertResult.identifiers[0].id,
			createdAt: new Date(),
		});

		return await this.groupRepo.findOne({
			where: { id: insertResult.identifiers[0].id },
		});
	}

	async updateOne(id: string, dto: UpdateGroupRequest) {
		// check if group exists
		await this.findOne(id);

		await this.groupRepo.update(id, dto);
	}

	async findMany() {
		const userId = this.cls.get("profile.id");
		return await this.groupRepo.find({
			where: [
				{
					createdBy: userId,
				},
				{
					userGroups: {
						userId: userId,
					},
				},
			],
		});
	}

	async findOne(id: string) {
		const userId = this.cls.get("profile.id");
		const group = await this.groupRepo.findOne({
			where: [
				{
					id,
					createdBy: userId,
				},
				{
					id,
					userGroups: {
						userId: userId,
					},
				},
			],
		});
		if (!group) {
			throw new GroupNotExistedError();
		}
		return group;
	}

	async deleteOne(id: string) {
		// when have table user group will check if user is the owner of the group
		const group = await this.findOne(id);
		group.isActive = false;
		await this.groupRepo.save(group);
	}
}
