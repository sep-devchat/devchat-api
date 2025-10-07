import { Injectable } from "@nestjs/common";
import {
	CreateAdminRoleRequest,
	UpdateAdminRoleRequest,
	AdminRoleQuery,
} from "./dto";
import { AdminRoleRepository, UserRepository } from "@db/repositories";
import { AdminRoleResponse } from "./dto";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { ILike } from "typeorm";
import { PaginationDto } from "@utils";
import {
	RoleAlreadyExistsError,
	RoleNotFoundError,
	UserNotFoundError,
} from "./error";

@Injectable()
export class AdminRoleService {
	constructor(
		private readonly adminRoleRepo: AdminRoleRepository,
		private readonly userRepo: UserRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async createOne(dto: CreateAdminRoleRequest) {
		const exists = await this.adminRoleRepo.findOne({
			where: { role: dto.role },
		});
		if (exists) throw new RoleAlreadyExistsError({ role: dto.role });
		const entity = this.adminRoleRepo.create({
			role: dto.role,
			roleName: dto.roleName,
			permissions: dto.permissions,
			isActive: dto.isActive ?? true,
			createdBy: this.cls.get("profile")?.id || "system",
			updatedBy: null,
			deletedBy: null,
		});
		await this.adminRoleRepo.save(entity);
		return AdminRoleResponse.fromEntity(entity);
	}

	async updateOne(id: string, dto: UpdateAdminRoleRequest) {
		const entity = await this.adminRoleRepo.findOne({ where: { id } });
		if (!entity) throw new RoleNotFoundError({ id });
		if (dto.role && dto.role !== entity.role) {
			const duplicate = await this.adminRoleRepo.findOne({
				where: { role: dto.role },
			});
			if (duplicate) throw new RoleAlreadyExistsError({ role: dto.role });
			entity.role = dto.role;
		}
		if (dto.roleName !== undefined) entity.roleName = dto.roleName;
		if (dto.permissions !== undefined) entity.permissions = dto.permissions;
		if (dto.isActive !== undefined) entity.isActive = dto.isActive;
		entity.updatedBy = this.cls.get("profile")?.id || "system";
		await this.adminRoleRepo.save(entity);
		return AdminRoleResponse.fromEntity(entity);
	}

	async findMany(query: AdminRoleQuery) {
		const page = query.page || 1;
		const limit = query.limit || 20;
		const where: any = { deletedAt: null };
		if (query.role) where.role = query.role;
		if (query.search) where.roleName = ILike(`%${query.search}%`);
		const [items, total] = await this.adminRoleRepo.findAndCount({
			where,
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});
		return {
			data: AdminRoleResponse.fromEntities(items),
			pagination: new PaginationDto(page, limit, total),
		};
	}

	async findOne(id: string) {
		const entity = await this.adminRoleRepo.findOne({
			where: { id, deletedAt: null },
		});
		if (!entity) throw new RoleNotFoundError({ id });
		return AdminRoleResponse.fromEntity(entity);
	}

	async deleteOne(id: string) {
		const entity = await this.adminRoleRepo.findOne({
			where: { id, deletedAt: null },
		});
		if (!entity) throw new RoleNotFoundError({ id });
		entity.deletedAt = new Date();
		entity.isActive = false;
		entity.deletedBy = this.cls.get("profile")?.id || "system";
		await this.adminRoleRepo.save(entity);
	}

	async assignUser(roleId: string, userId: string) {
		const role = await this.adminRoleRepo.findOne({
			where: { id: roleId, deletedAt: null },
		});
		if (!role) throw new RoleNotFoundError({ roleId });
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new UserNotFoundError({ userId });
		user.adminRoleId = role.id;
		await this.userRepo.save(user);
		return { userId: user.id, roleId: role.id };
	}

	async unassignUser(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new UserNotFoundError({ userId });
		user.adminRoleId = null;
		await this.userRepo.save(user);
		return { userId: user.id, roleId: null };
	}
}
