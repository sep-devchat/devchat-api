import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from "@nestjs/common";
import {
	CreateProgrammingLanguageRequest,
	UpdateProgrammingLanguageRequest,
	ProgrammingLanguageQuery,
} from "./dto";
import { SupportedProgrammingLanguageRepository } from "@db/repositories";
import { SupportedProgrammingLanguageEntity } from "@db/entities";
import { DevChatCls, PaginationDto } from "@utils";
import { FindOptionsWhere } from "typeorm";
import { ClsService } from "nestjs-cls";

@Injectable()
export class ProgrammingLanguageService {
	constructor(
		private readonly repo: SupportedProgrammingLanguageRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	private getCurrentUserId(): string {
		return this.cls.get("profile.id");
	}

	async createOne(
		dto: CreateProgrammingLanguageRequest,
	): Promise<SupportedProgrammingLanguageEntity> {
		const existing = await this.repo.findOne({
			where: {
				languageCode: dto.languageCode,
				languageVersion: dto.languageVersion ?? null,
			},
		});

		if (existing) {
			if (existing.isActive) {
				throw new BadRequestException(
					"Language with same code & version already exists",
				);
			} else {
				Object.assign(existing, {
					languageName: dto.languageName,
					preset: dto.preset ?? null,
					languageIcon: dto.languageIcon ?? null,
					isActive: true,
					updatedBy: this.getCurrentUserId(),
				});
				return this.repo.save(existing);
			}
		}

		const entity = this.repo.create({
			languageCode: dto.languageCode,
			languageName: dto.languageName,
			languageVersion: dto.languageVersion ?? null,
			preset: dto.preset ?? null,
			languageIcon: dto.languageIcon ?? null,
			isExecutable: dto.isExecutable ?? false,
			createdBy: this.getCurrentUserId(),
			updatedBy: this.getCurrentUserId(),
			useAiCheck: dto.useAiCheck ?? true,
		});
		return this.repo.save(entity);
	}

	async getActiveLanguages(): Promise<SupportedProgrammingLanguageEntity[]> {
		return this.repo.find({
			where: {
				isActive: true,
			},
		});
	}

	async updateOne(
		id: string,
		dto: UpdateProgrammingLanguageRequest,
	): Promise<SupportedProgrammingLanguageEntity> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException("Programming language not found");
		console.log(
			"Updating language code from",
			entity.languageCode,
			"to",
			dto.languageCode,
		);

		if (
			dto.languageCode &&
			dto.languageCode.toUpperCase() !== entity.languageCode.toUpperCase()
		) {
			const duplicate = await this.repo.findOne({
				where: {
					languageCode: dto.languageCode,
					languageVersion: dto.languageVersion ?? null,
				},
			});
			if (duplicate)
				throw new BadRequestException(
					"Language with same code & version already exists",
				);
		}
		Object.assign(entity, {
			languageCode: dto.languageCode,
			languageName: dto.languageName,
			languageVersion: dto.languageVersion ?? null,
			languageIcon: dto.languageIcon ?? null,
			preset: dto.preset ?? null,
			isExecutable: dto.isExecutable ?? false,
			useAiCheck: dto.useAiCheck ?? true,
			updatedBy: this.getCurrentUserId(),
		});
		return this.repo.save(entity);
	}

	async findMany(query: ProgrammingLanguageQuery): Promise<{
		data: SupportedProgrammingLanguageEntity[];
		pagination: PaginationDto;
	}> {
		const page = Number(query.page) > 0 ? Number(query.page) : 1;
		const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

		const where: FindOptionsWhere<SupportedProgrammingLanguageEntity> = {};
		if (typeof query.isActive === "boolean") {
			where.isActive = query.isActive;
		}
		if (typeof query.isExecutable === "boolean") {
			where.isExecutable = query.isExecutable;
		}

		const [data, total] = await this.repo.findAndCount({
			where,
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		return {
			data,
			pagination: new PaginationDto(page, limit, total),
		};
	}

	async findOne(id: string): Promise<SupportedProgrammingLanguageEntity> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException("Programming language not found");
		return entity;
	}

	async toggleIsActive(
		id: string,
	): Promise<SupportedProgrammingLanguageEntity> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException("Programming language not found");
		entity.isActive = !entity.isActive;
		entity.updatedBy = this.getCurrentUserId();
		return this.repo.save(entity);
	}
}
