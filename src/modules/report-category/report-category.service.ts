import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	CreateReportCategoryRequest,
	UpdateReportCategoryRequest,
	ReportCategoryQuery,
	ReportCategoryAdminQuery,
	ReportCategoryResponse,
} from "./dto";
import { ReportCategoryRepository } from "@db/repositories";
import { ReportCategoryEntity } from "@db/entities";
import { FindOptionsWhere, ILike } from "typeorm";
import { PaginationDto } from "@utils";

interface AdminListResult {
	data: ReportCategoryResponse[];
	pagination: PaginationDto;
}

@Injectable()
export class ReportCategoryService {
	constructor(private readonly repo: ReportCategoryRepository) {}

	private normalizeName(value: string) {
		return value.trim();
	}

	private normalizeDescription(value?: string) {
		return value?.trim() ?? "";
	}

	private async ensureNameAvailable(name: string, ignoreId?: string) {
		const existing = await this.repo.findOne({ where: { name } });
		if (!existing) return;
		if (ignoreId && existing.id === ignoreId) {
			return;
		}
		if (!existing.isRemoved) {
			throw new BadRequestException("Report category name already exists");
		}
	}

	async createOne(
		dto: CreateReportCategoryRequest,
	): Promise<ReportCategoryResponse> {
		const name = this.normalizeName(dto.name);
		const description = this.normalizeDescription(dto.description);

		const existing = await this.repo.findOne({ where: { name } });
		if (existing) {
			if (!existing.isRemoved) {
				throw new BadRequestException("Report category name already exists");
			}
			Object.assign(existing, { description, isRemoved: false });
			return ReportCategoryResponse.fromEntity(await this.repo.save(existing));
		}

		const entity = this.repo.create({ name, description });
		return ReportCategoryResponse.fromEntity(await this.repo.save(entity));
	}

	async updateOne(
		id: string,
		dto: UpdateReportCategoryRequest,
	): Promise<ReportCategoryResponse> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity || entity.isRemoved) {
			throw new NotFoundException("Report category not found");
		}

		if (dto.name) {
			const normalizedName = this.normalizeName(dto.name);
			await this.ensureNameAvailable(normalizedName, id);
			entity.name = normalizedName;
		}

		if (dto.description !== undefined) {
			entity.description = this.normalizeDescription(dto.description);
		}

		return ReportCategoryResponse.fromEntity(await this.repo.save(entity));
	}

	async findMany(
		query: ReportCategoryQuery,
	): Promise<ReportCategoryResponse[]> {
		const where:
			| FindOptionsWhere<ReportCategoryEntity>[]
			| FindOptionsWhere<ReportCategoryEntity> = query.search
			? [
					{ isRemoved: false, name: ILike(`%${query.search}%`) },
					{ isRemoved: false, description: ILike(`%${query.search}%`) },
				]
			: { isRemoved: false };

		const categories = await this.repo.find({
			where,
			order: { name: "ASC" },
		});
		return ReportCategoryResponse.fromEntities(categories);
	}

	async findManyAdmin(
		query: ReportCategoryAdminQuery,
	): Promise<AdminListResult> {
		const page = query.page ?? 1;
		const take = query.take ?? 20;
		const searchTerm = query.search?.trim();
		const likeOperator = searchTerm ? ILike(`%${searchTerm}%`) : undefined;

		const where:
			| FindOptionsWhere<ReportCategoryEntity>
			| FindOptionsWhere<ReportCategoryEntity>[] = likeOperator
			? [{ name: likeOperator }, { description: likeOperator }]
			: {};

		const [entities, total] = await this.repo.findAndCount({
			where,
			order: { name: "ASC" },
			skip: (page - 1) * take,
			take,
		});

		return {
			data: ReportCategoryResponse.fromEntities(entities),
			pagination: new PaginationDto(page, take, total),
		};
	}

	async findOne(id: string): Promise<ReportCategoryResponse> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity || entity.isRemoved) {
			throw new NotFoundException("Report category not found");
		}
		return ReportCategoryResponse.fromEntity(entity);
	}

	async deleteOne(id: string): Promise<ReportCategoryResponse> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) {
			throw new NotFoundException("Report category not found");
		}
		entity.isRemoved = !entity.isRemoved;
		return ReportCategoryResponse.fromEntity(await this.repo.save(entity));
	}
}
