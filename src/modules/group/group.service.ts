import { Injectable } from "@nestjs/common";
import { CreateGroupRequest, UpdateGroupRequest, GroupQuery } from "./dto";
import { GroupRepository } from "@db/repositories";
import { Like } from "typeorm";
import { GroupNotExistedError } from "./errors";
import { DevChatCls, PaginationDto } from "@utils";
import { ClsService } from "nestjs-cls";

@Injectable()
export class GroupService {
	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async createOne(dto: CreateGroupRequest) {
		const createdBy = this.cls.get("profile").id;
		const group = this.groupRepo.create({
			name: dto.name,
			avatar: dto.avatar ?? null,
			description: dto.description ?? null,
			createdBy,
		});

		await this.groupRepo.insert(group);

		return group;
	}

	async updateOne(id: string, dto: UpdateGroupRequest) {
		// check if group exists
		await this.findOne(id);

		await this.groupRepo.update(id, dto);
	}

	async findMany(query: GroupQuery) {
		const { page, limit, name } = query;
		const [data, total] = await this.groupRepo.findAndCount({
			where: {
				...(name ? { name: Like(`%${name}%`) } : {}),
				isActive: true,
				// When have table UserGroup will add more condition here
			},
			skip: (page - 1) * page,
			take: limit,
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async findOne(id: string) {
		const group = await this.groupRepo.findOne({ where: { id } });
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
