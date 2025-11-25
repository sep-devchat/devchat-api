import { Injectable } from "@nestjs/common";
import { CreateReportRequest, UpdateReportRequest, ReportQuery } from "./dto";
import {
	MessageRepository,
	ReportReportCategoryRepository,
	ReportRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { FindOptionsWhere, In } from "typeorm";
import { ReportEntity } from "@db/entities";

@Injectable()
export class ReportService {
	constructor(
		private readonly cls: ClsService<DevChatCls>,
		private readonly reportRepo: ReportRepository,
		private readonly reportReportCategoryRepo: ReportReportCategoryRepository,
		private readonly messageRepo: MessageRepository,
	) {}

	async createOne(dto: CreateReportRequest) {
		const currentUserId = this.cls.get("profile.id");

		await this.reportRepo.save({
			content: dto.content,
			createdById: currentUserId,
			messageId: dto.messageId,
			reportReportCategories: dto.reportCategoryIds.map((id) =>
				this.reportReportCategoryRepo.create({
					reportCategoryId: id,
				}),
			),
		});
	}

	async findMany(query: ReportQuery) {
		const where: FindOptionsWhere<ReportEntity> = {};

		if (query.messageId) {
			where.messageId = query.messageId;
		}

		if (query.createdById) {
			where.createdById = query.createdById;
		}

		if (query.reportCategoryIds) {
			where.reportReportCategories = {
				reportCategoryId: In(query.reportCategoryIds),
			};
		}

		const [data, total] = await this.reportRepo.findAndCount({
			where,
			order: {
				createdAt: "DESC",
			},
			take: query.limit,
			skip: (query.page - 1) * query.limit,
			relations: {
				createdBy: true,
				message: { sender: true },
				directMessage: { toUser: true },
				threadMessage: { sender: true },
				reportReportCategories: {
					reportCategory: true,
				},
			},
		});

		return { data, total };
	}

	async findOne(id: string | number) {}

	async deleteOne(id: string | number) {}
}
