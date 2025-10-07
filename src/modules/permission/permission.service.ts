import { Injectable } from "@nestjs/common";
import {
	CreatePermissionRequest,
	UpdatePermissionRequest,
	PermissionQuery,
	PermissionResponse,
} from "./dto";
import { PermissionRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { ILike } from "typeorm";
import { PermissionCodeExistsError, PermissionNotFoundError } from "./error";

@Injectable()
export class PermissionService {
	constructor(
		private readonly permissionRepo: PermissionRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async createOne(dto: CreatePermissionRequest) {
		const exists = await this.permissionRepo.findOne({
			where: { code: dto.code },
		});
		if (exists) throw new PermissionCodeExistsError({ code: dto.code });
		const entity = this.permissionRepo.create({
			code: dto.code,
			name: dto.name,
			description: dto.description ?? null,
			createdBy: this.cls.get("profile")?.id || "system",
			updatedBy: null,
			deletedBy: null,
			isActive: true,
		});
		await this.permissionRepo.save(entity);
		return PermissionResponse.fromEntity(entity);
	}

	async updateOne(id: string, dto: UpdatePermissionRequest) {
		const entity = await this.permissionRepo.findOne({
			where: { id, deletedAt: null },
		});
		if (!entity) throw new PermissionNotFoundError({ id });
		if (dto.code && dto.code !== entity.code) {
			const dup = await this.permissionRepo.findOne({
				where: { code: dto.code },
			});
			if (dup) throw new PermissionCodeExistsError({ code: dto.code });
			entity.code = dto.code;
		}
		if (dto.name !== undefined) entity.name = dto.name;
		if (dto.description !== undefined) entity.description = dto.description;
		entity.updatedBy = this.cls.get("profile")?.id || "system";
		await this.permissionRepo.save(entity);
		return PermissionResponse.fromEntity(entity);
	}

	async findMany(query: PermissionQuery) {
		const page = query.page || 1;
		const limit = query.limit || 20;
		const where: any = { deletedAt: null };
		if (query.search) {
			where.code = ILike(`%${query.search}%`);
			// also search name OR - crude combined approach; for proper OR use a QueryBuilder.
		}
		const [items, total] = await this.permissionRepo.findAndCount({
			where,
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});
		return {
			data: PermissionResponse.fromEntities(items),
			pagination: new PaginationDto(page, limit, total),
		};
	}

	async findOne(id: string) {
		const entity = await this.permissionRepo.findOne({
			where: { id, deletedAt: null },
		});
		if (!entity) throw new PermissionNotFoundError({ id });
		return PermissionResponse.fromEntity(entity);
	}

	async deleteOne(id: string) {
		const entity = await this.permissionRepo.findOne({
			where: { id, deletedAt: null },
		});
		if (!entity) throw new PermissionNotFoundError({ id });
		entity.deletedAt = new Date();
		entity.isActive = false;
		entity.deletedBy = this.cls.get("profile")?.id || "system";
		await this.permissionRepo.save(entity);
	}
}
