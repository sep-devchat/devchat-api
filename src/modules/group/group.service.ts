import { Injectable } from "@nestjs/common";
import { CreateGroupRequest, UpdateGroupRequest, GroupQuery } from "./dto";
import { GroupRepository } from "@db/repositories";
import { Like } from "typeorm";
import { GroupNotExistedError } from "./errors";
import { PaginationDto } from "@utils";
import { UserService } from "@modules/user";

@Injectable()
export class GroupService {
	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly userService: UserService,
	) {}

	async createOne(dto: CreateGroupRequest) {
		// This function will throw an error if user not found
		// So that, do need need to throw again in this Group service
		await this.userService.findById(dto.createdBy);

		const group = this.groupRepo.create({
			name: dto.name,
			avatar: dto.avatar ?? null,
			description: dto.description ?? null,
			createdBy: dto.createdBy,
			isActive: dto.isActive,
		});

		await this.groupRepo.insert(group);

		return group;
	}

	async updateOne(id: string, dto: UpdateGroupRequest) {
		// check if group exists
		await this.findOne(id);
		// check if createdBy user exists
		await this.userService.findById(dto.createdBy);

		await this.groupRepo.update(id, dto);
	}

	async findMany(query: GroupQuery) {
		const { page, limit, name } = query;
		const [data, total] = await this.groupRepo.findAndCount({
			where: {
				...(name ? { name: Like(`%${name}%`) } : {}),
				isActive: true,
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
		const group = await this.findOne(id);
		group.isActive = false;
		await this.groupRepo.save(group);
	}
}
