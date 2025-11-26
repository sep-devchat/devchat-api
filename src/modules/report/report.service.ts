import { BadRequestException, Injectable } from "@nestjs/common";
import {
	CreateReportRequest,
	ReportAnalyticsCategoryQuery,
	ReportAnalyticsRangeQuery,
	ReportAnalyticsReporterQuery,
	ReportAnalyticsSummaryQuery,
	ReportAnalyticsTrendQuery,
	ReportAnalyticsSummaryResponse,
	ReportCategoryStatResponse,
	ReportReporterStatResponse,
	ReportTrendPointResponse,
	ReportTypeDistributionResponse,
	ReportQuery,
} from "./dto";
import {
	ReportReportCategoryRepository,
	ReportRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, MessageTypeEnum } from "@utils";
import { Between, FindOptionsWhere, In, IsNull, Not } from "typeorm";
import { ReportEntity } from "@db/entities";
import * as dayjs from "dayjs";

const ANALYTICS_DEFAULT_TZ = "UTC";
const DEFAULT_TREND_DAYS = 14;
const DEFAULT_RECENT_DAYS = 7;
const DEFAULT_REPORTER_LIMIT = 5;
const DEFAULT_CATEGORY_LIMIT = 10;
const MAX_TREND_DAYS = 90;
const MAX_RECENT_DAYS = 30;
const MAX_REPORTER_LIMIT = 50;
const MAX_CATEGORY_LIMIT = 50;

interface TrendBucket {
	key: string;
	label: string;
	startZoned: dayjs.Dayjs;
	endZoned: dayjs.Dayjs;
	startUtc: Date;
	endUtc: Date;
	reports: number;
}

interface DateRange {
	startUtc: Date;
	endUtc: Date;
}

type TrendGranularity = "daily" | "monthly";

@Injectable()
export class ReportService {
	constructor(
		private readonly cls: ClsService<DevChatCls>,
		private readonly reportRepo: ReportRepository,
		private readonly reportReportCategoryRepo: ReportReportCategoryRepository,
	) {}

	async createOne(dto: CreateReportRequest) {
		const currentUserId = this.cls.get("profile.id");

		await this.reportRepo.save({
			content: dto.content,
			createdById: currentUserId,
			messageId: dto.messageId,
			messageType: dto.messageType,
			reportReportCategories: dto.reportCategoryIds.map((id) =>
				this.reportReportCategoryRepo.create({
					reportCategoryId: id,
				}),
			),
		});
	}

	async findMany(query: ReportQuery) {
		const where: FindOptionsWhere<ReportEntity> = {};

		if (query.messageId && query.messageType) {
			where.messageId = query.messageId;
			where.messageType = query.messageType;
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
				directMessage: { fromUser: true, toUser: true },
				threadMessage: { sender: true },
				reportReportCategories: {
					reportCategory: true,
				},
			},
		});

		return { data, total };
	}

	async getSummary(
		query: ReportAnalyticsSummaryQuery,
	): Promise<ReportAnalyticsSummaryResponse> {
		const timezone = this.resolveTimezone(query.timezone);
		const requestedRange = this.resolveRequestedRange(query, timezone);
		const recentDays = this.clamp(
			query.recentDays ?? DEFAULT_RECENT_DAYS,
			1,
			MAX_RECENT_DAYS,
		);
		const now = dayjs().tz(timezone);
		const fallbackStart = now
			.clone()
			.subtract(recentDays - 1, "day")
			.startOf("day");
		const recentRange =
			requestedRange ??
			this.buildUtcRange(fallbackStart, now.clone().endOf("day"));

		const [totalReports, recentReports, reporterRows, topCategory] =
			await Promise.all([
				this.reportRepo.count(),
				this.reportRepo.count({
					where: {
						createdAt: Between(recentRange.startUtc, recentRange.endUtc),
					},
				}),
				this.reportRepo.find({
					select: {
						createdById: true,
						id: true,
					},
					where: {
						createdById: Not(IsNull()),
						...(requestedRange
							? {
									createdAt: Between(recentRange.startUtc, recentRange.endUtc),
								}
							: {}),
					},
				}),
				this.getCategoryBreakdown({
					limit: 1,
					start: query.start,
					end: query.end,
					timezone: query.timezone,
				}).then((categories) => categories[0]),
			]);

		const uniqueReporterIds = new Set(
			reporterRows
				.map((row) => row.createdById)
				.filter((id): id is string => Boolean(id)),
		);

		return {
			totalReports,
			recentReports,
			uniqueReporters: uniqueReporterIds.size,
			topCategory: topCategory?.name ?? null,
		};
	}

	async getTrend(
		query: ReportAnalyticsTrendQuery,
	): Promise<ReportTrendPointResponse[]> {
		const timezone = this.resolveTimezone(query.timezone);
		const granularity: TrendGranularity = query.granularity ?? "daily";
		const hasCustomRange = Boolean(query.start && query.end);
		if (granularity === "monthly" && !hasCustomRange) {
			throw new BadRequestException(
				"Monthly granularity requires both start and end parameters",
			);
		}

		let trendBuckets: TrendBucket[] = [];
		if (hasCustomRange) {
			const startBoundary = this.parseBoundary(
				query.start!,
				granularity,
				timezone,
				"start",
			);
			const endBoundary = this.parseBoundary(
				query.end!,
				granularity,
				timezone,
				"end",
			);
			if (!startBoundary || !endBoundary) {
				throw new BadRequestException("Invalid date range provided");
			}
			const [normalizedStart, normalizedEnd] = startBoundary.isAfter(
				endBoundary,
			)
				? [endBoundary, startBoundary]
				: [startBoundary, endBoundary];
			trendBuckets = this.buildBucketsFromRange(
				granularity,
				normalizedStart,
				normalizedEnd,
			);
		} else {
			const trendDays = this.clamp(
				query.trendDays ?? DEFAULT_TREND_DAYS,
				3,
				MAX_TREND_DAYS,
			);
			const now = dayjs().tz(timezone);
			trendBuckets = this.buildTrendBuckets(now, trendDays);
		}

		if (!trendBuckets.length) {
			return [];
		}
		const bucketMap = new Map(
			trendBuckets.map((bucket) => [bucket.key, bucket]),
		);
		const trendRange = {
			startUtc: trendBuckets[0].startUtc,
			endUtc: trendBuckets[trendBuckets.length - 1].endUtc,
		};
		const trendRows = await this.reportRepo.find({
			select: {
				id: true,
				createdAt: true,
			},
			where: {
				createdAt: Between(trendRange.startUtc, trendRange.endUtc),
			},
		});

		trendRows.forEach((row) => {
			const createdAt = row.createdAt ?? null;
			if (!createdAt) {
				return;
			}
			const bucketKey = dayjs(createdAt)
				.tz(timezone)
				.startOf(granularity === "monthly" ? "month" : "day")
				.format(granularity === "monthly" ? "YYYY-MM" : "YYYY-MM-DD");
			const bucket = bucketMap.get(bucketKey);
			if (bucket) {
				bucket.reports += 1;
			}
		});

		return trendBuckets.map((bucket) => ({
			label: bucket.label,
			start: bucket.startZoned.toISOString(),
			end: bucket.endZoned.toISOString(),
			reports: bucket.reports,
		}));
	}

	async getMessageTypeDistribution(
		query: ReportAnalyticsRangeQuery,
	): Promise<ReportTypeDistributionResponse[]> {
		const timezone = this.resolveTimezone(query.timezone);
		const range = this.resolveRequestedRange(query, timezone);
		const rows = await this.reportRepo.find({
			select: {
				id: true,
				messageType: true,
			},
			where: range
				? {
						createdAt: Between(range.startUtc, range.endUtc),
					}
				: undefined,
		});

		const counts: Record<string, number> = {};
		rows.forEach((row) => {
			if (!row.messageType) {
				return;
			}
			counts[row.messageType] = (counts[row.messageType] ?? 0) + 1;
		});

		return Object.entries(counts).map(([type, count]) => ({
			type: type as MessageTypeEnum,
			count,
		}));
	}

	async getCategoryBreakdown(
		query: ReportAnalyticsCategoryQuery,
	): Promise<ReportCategoryStatResponse[]> {
		const limit = this.clamp(
			query.limit ?? DEFAULT_CATEGORY_LIMIT,
			1,
			MAX_CATEGORY_LIMIT,
		);
		const timezone = this.resolveTimezone(query.timezone);
		const range = this.resolveRequestedRange(query, timezone);

		const reports = await this.reportRepo.find({
			relations: {
				reportReportCategories: {
					reportCategory: true,
				},
			},
			where: range
				? {
						createdAt: Between(range.startUtc, range.endUtc),
					}
				: undefined,
		});

		const categoryMap = new Map<string, ReportCategoryStatResponse>();
		reports.forEach((report) => {
			report.reportReportCategories?.forEach((pivot) => {
				const category = pivot.reportCategory;
				if (!category) {
					return;
				}
				const existing = categoryMap.get(category.id);
				if (existing) {
					existing.count += 1;
				} else {
					categoryMap.set(category.id, {
						id: category.id,
						name: category.name,
						count: 1,
					});
				}
			});
		});

		return Array.from(categoryMap.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, limit);
	}

	async getReporterLeaderboard(
		query: ReportAnalyticsReporterQuery,
	): Promise<ReportReporterStatResponse[]> {
		const limit = this.clamp(
			query.limit ?? DEFAULT_REPORTER_LIMIT,
			1,
			MAX_REPORTER_LIMIT,
		);
		const timezone = this.resolveTimezone(query.timezone);
		const range = this.resolveRequestedRange(query, timezone);

		const reports = await this.reportRepo.find({
			select: {
				createdById: true,
				id: true,
				createdBy: {
					firstName: true,
					lastName: true,
					username: true,
					email: true,
				},
			},
			relations: {
				createdBy: true,
			},
			where: {
				createdById: Not(IsNull()),
				...(range
					? {
							createdAt: Between(range.startUtc, range.endUtc),
						}
					: {}),
			},
		});

		const reporterMap = new Map<string, ReportReporterStatResponse>();
		reports.forEach((report) => {
			const reporter = report.createdBy;
			const reporterId = report.createdById;
			if (!reporter || !reporterId) {
				return;
			}
			const composedName = [reporter.firstName, reporter.lastName]
				.filter(Boolean)
				.join(" ")
				.trim();
			const fallback =
				reporter.username ?? reporter.email ?? "Unknown reporter";

			const existing = reporterMap.get(reporterId);
			if (existing) {
				existing.reports += 1;
			} else {
				reporterMap.set(reporterId, {
					id: reporterId,
					name: composedName || fallback,
					email: reporter.email ?? null,
					username: reporter.username ?? null,
					reports: 1,
				});
			}
		});

		return Array.from(reporterMap.values())
			.sort((a, b) => b.reports - a.reports)
			.slice(0, limit);
	}

	private resolveRequestedRange(
		query: Pick<ReportAnalyticsRangeQuery, "start" | "end">,
		timezone: string,
	): DateRange | null {
		if (!query.start && !query.end) {
			return null;
		}
		if (!query.start || !query.end) {
			throw new BadRequestException(
				"Both start and end parameters are required to filter by range",
			);
		}
		const startZoned = dayjs.tz(query.start, timezone);
		const endZoned = dayjs.tz(query.end, timezone);
		if (!startZoned.isValid() || !endZoned.isValid()) {
			throw new BadRequestException("Invalid date range provided");
		}
		const [normalizedStart, normalizedEnd] = startZoned.isAfter(endZoned)
			? [endZoned, startZoned]
			: [startZoned, endZoned];
		return this.buildUtcRange(
			normalizedStart.startOf("day"),
			normalizedEnd.endOf("day"),
		);
	}

	private parseBoundary(
		value: string,
		granularity: TrendGranularity,
		timezone: string,
		boundary: "start" | "end",
	): dayjs.Dayjs | null {
		if (!value) {
			return null;
		}
		const unit = granularity === "monthly" ? "month" : "day";
		const normalizedValue = granularity === "monthly" ? `${value}-01` : value;
		const parsed = dayjs.tz(normalizedValue, timezone);
		if (!parsed.isValid()) {
			return null;
		}
		return boundary === "start"
			? parsed.startOf(unit)
			: parsed.endOf(unit as dayjs.OpUnitType);
	}

	private buildBucketsFromRange(
		granularity: TrendGranularity,
		start: dayjs.Dayjs,
		end: dayjs.Dayjs,
	): TrendBucket[] {
		const unit = granularity === "monthly" ? "month" : "day";
		const keyFormat = granularity === "monthly" ? "YYYY-MM" : "YYYY-MM-DD";
		const labelFormat = granularity === "monthly" ? "MMM YYYY" : "MMM D";
		const buckets: TrendBucket[] = [];
		let cursor = start.clone().startOf(unit);
		while (cursor.isBefore(end) || cursor.isSame(end, unit)) {
			const bucketStart = cursor.clone();
			const bucketEnd = bucketStart.clone().endOf(unit);
			buckets.push({
				key: bucketStart.format(keyFormat),
				label: bucketStart.format(labelFormat),
				startZoned: bucketStart,
				endZoned: bucketEnd,
				startUtc: bucketStart.clone().utc().toDate(),
				endUtc: bucketEnd.clone().utc().toDate(),
				reports: 0,
			});
			cursor = bucketEnd.add(1, unit as dayjs.ManipulateType).startOf(unit);
		}
		return buckets;
	}

	private resolveTimezone(timezone?: string) {
		if (!timezone) {
			return ANALYTICS_DEFAULT_TZ;
		}
		try {
			new Intl.DateTimeFormat(undefined, { timeZone: timezone }).format();
			return timezone;
		} catch (error) {
			return ANALYTICS_DEFAULT_TZ;
		}
	}

	private clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	private buildUtcRange(start: dayjs.Dayjs, end: dayjs.Dayjs): DateRange {
		return {
			startUtc: start.clone().utc().toDate(),
			endUtc: end.clone().utc().toDate(),
		};
	}

	private buildTrendBuckets(now: dayjs.Dayjs, days: number): TrendBucket[] {
		return Array.from({ length: days }, (_, index) => {
			const dayStart = now
				.clone()
				.subtract(days - index - 1, "day")
				.startOf("day");
			const dayEnd = dayStart.clone().endOf("day");
			return {
				key: dayStart.format("YYYY-MM-DD"),
				label: dayStart.format("MMM D"),
				startZoned: dayStart,
				endZoned: dayEnd,
				startUtc: dayStart.clone().utc().toDate(),
				endUtc: dayEnd.clone().utc().toDate(),
				reports: 0,
			};
		});
	}
}
