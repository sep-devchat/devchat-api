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
import { ClsService } from "nestjs-cls";

interface ListResult<T> {
	data: T[];
	pagination: PaginationDto;
}

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
					syntaxHighlighting: dto.syntaxHighlighting ?? null,
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
			syntaxHighlighting: dto.syntaxHighlighting ?? null,
			languageIcon: dto.languageIcon ?? null,
			createdBy: this.getCurrentUserId(),
			updatedBy: this.getCurrentUserId(),
		});
		return this.repo.save(entity);
	}

	async updateOne(
		id: string,
		dto: UpdateProgrammingLanguageRequest,
	): Promise<SupportedProgrammingLanguageEntity> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException("Programming language not found");
		if (dto.languageCode && dto.languageCode !== entity.languageCode) {
			const duplicate = await this.repo.findOne({
				where: {
					languageCode: dto.languageCode,
					languageVersion:
						dto.languageVersion ?? entity.languageVersion ?? null,
				},
			});
			if (duplicate)
				throw new BadRequestException(
					"Language with same code & version already exists",
				);
		}
		Object.assign(entity, {
			languageCode: dto.languageCode ?? entity.languageCode,
			languageName: dto.languageName ?? entity.languageName,
			languageVersion: dto.languageVersion ?? entity.languageVersion,
			languageIcon: dto.languageIcon ?? entity.languageIcon,
			syntaxHighlighting: dto.syntaxHighlighting ?? entity.syntaxHighlighting,
			updatedBy: this.getCurrentUserId(),
		});
		return this.repo.save(entity);
	}

	async findMany(
		query: ProgrammingLanguageQuery,
	): Promise<ListResult<SupportedProgrammingLanguageEntity>> {
		const { page = 1, take = 20, code, name, version, search } = query;
		const [entities, total] = await this.repo.findFiltered({
			page,
			take,
			code,
			name,
			version,
			search,
		});
		return { data: entities, pagination: new PaginationDto(page, take, total) };
	}

	async findOne(id: string): Promise<SupportedProgrammingLanguageEntity> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException("Programming language not found");
		return entity;
	}

	async deleteOne(id: string): Promise<void> {
		const entity = await this.repo.findOne({ where: { id } });
		if (!entity) throw new NotFoundException("Programming language not found");
		await this.repo.update(id, {
			isActive: false,
			updatedBy: this.getCurrentUserId(),
		});
	}
}
