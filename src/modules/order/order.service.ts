import { BadRequestException, Injectable } from "@nestjs/common";
import {
	CreateOrderRequest,
	UpdateOrderRequest,
	OrderQuery,
	OrderResponse,
	OrderReportOverviewQuery,
	OrderReportOverviewResponse,
} from "./dto";
import {
	GroupRepository,
	GroupSubscriptionRepository,
	OrderRepository,
	SubscriptionRepository,
} from "@db/repositories";
import { PaginationDto } from "@utils";
import { In } from "typeorm";

@Injectable()
export class OrderService {
	constructor(
		private readonly orderRepository: OrderRepository,
		private readonly groupRepository: GroupRepository,
		private readonly subscriptionRepository: SubscriptionRepository,
		private readonly groupSubscriptionRepository: GroupSubscriptionRepository,
	) {}

	async createOne(dto: CreateOrderRequest) {
		const group = await this.groupRepository.findOne({
			where: { id: dto.groupId },
		});
		if (!group) {
			throw new Error("Group not found");
		}

		const subscription = await this.subscriptionRepository.findOne({
			where: { id: dto.subscriptionId },
		});
		if (!subscription) {
			throw new Error("Subscription not found");
		}

		const groupSubscription = await this.groupSubscriptionRepository.findOne({
			where: {
				groupId: dto.groupId,
				subscriptionId: dto.subscriptionId,
			},
		});
		if (!groupSubscription) {
			throw new Error("Group subscription not found");
		}

		const orderStatus = groupSubscription.isPaid ? "PAID" : "PENDING";

		const order = this.orderRepository.create({
			groupId: dto.groupId,
			subscriptionId: dto.subscriptionId,
			monthQuantity: groupSubscription.monthQuantity,
			paymentBy: groupSubscription.paymentBy,
			orderStatus: orderStatus,
		});
		await this.orderRepository.save(order);

		return order;
	}

	async findMany(query: OrderQuery) {
		const page = Number.isFinite(query?.page) ? Number(query.page) : 1;
		const limit = Number.isFinite(query?.limit) ? Number(query.limit) : 20;
		const skip = (page - 1) * limit;

		const groupId = query?.groupId ? String(query.groupId) : undefined;
		// Business rule: do not return PENDING orders in list views.
		// Keep only completed/finalized statuses.
		const allowedStatuses = ["PAID", "FAILED"] as const;

		const allowedSortBy = new Set(["createdAt", "orderCode", "orderStatus"]);
		const sortBy = allowedSortBy.has(String(query?.sortBy))
			? (String(query?.sortBy) as "createdAt" | "orderCode" | "orderStatus")
			: "createdAt";
		const sortOrder = query?.sortOrder === "ASC" ? "ASC" : "DESC";

		const [orders, totalRecord] = await this.orderRepository.findAndCount({
			where: groupId
				? { groupId, orderStatus: In([...allowedStatuses]) }
				: { orderStatus: In([...allowedStatuses]) },
			relations: { group: true, subscription: true },
			order: { [sortBy]: sortOrder } as any,
			skip,
			take: limit,
		});

		return {
			data: orders.map((order) => OrderResponse.fromEntity(order)),
			pagination: new PaginationDto(page, limit, totalRecord),
		};
	}

	async findOne(id: string) {
		const order = await this.orderRepository.findOne({
			where: { id },
			relations: {
				group: true,
				subscription: true,
				orderTransactions: { user: true },
			},
		});
		if (!order) {
			throw new Error("Order not found");
		}
		return OrderResponse.fromEntity(order);
	}

	async getReportOverview(
		query: OrderReportOverviewQuery,
	): Promise<OrderReportOverviewResponse> {
		const from = query?.from ? new Date(String(query.from)) : undefined;
		const to = query?.to ? new Date(String(query.to)) : undefined;

		if (from && Number.isNaN(from.getTime())) {
			throw new BadRequestException("Invalid 'from' datetime");
		}
		if (to && Number.isNaN(to.getTime())) {
			throw new BadRequestException("Invalid 'to' datetime");
		}

		// Revenue definition (current schema): sum(subscription.price * order.monthQuantity) for PAID orders.
		// Note: We use the order's createdAt for date filtering because there is no paidAt field.
		const base = this.orderRepository
			.createQueryBuilder("o")
			.leftJoin("o.subscription", "s")
			.where("o.orderStatus = :paid", { paid: "PAID" });

		if (from) {
			base.andWhere("o.createdAt >= :from", { from });
		}
		if (to) {
			base.andWhere("o.createdAt <= :to", { to });
		}

		const [totalsRaw, bySubscriptionRaw, byDayRaw] = await Promise.all([
			base
				.clone()
				.select("COUNT(o.id)", "totalOrdersSold")
				.addSelect(
					"COALESCE(SUM(o.monthQuantity), 0)",
					"totalSubscriptionsSold",
				)
				.addSelect(
					"COALESCE(SUM(ROUND(s.price * o.monthQuantity)), 0)",
					"totalRevenueVnd",
				)
				.getRawOne<{
					totalOrdersSold: string | number | null;
					totalSubscriptionsSold: string | number | null;
					totalRevenueVnd: string | number | null;
				}>(),
			base
				.clone()
				.select("s.id", "subscriptionId")
				.addSelect("s.subscriptionCode", "subscriptionCode")
				.addSelect("s.subscriptionName", "subscriptionName")
				.addSelect("s.version", "subscriptionVersion")
				.addSelect("COUNT(o.id)", "ordersSold")
				.addSelect("COALESCE(SUM(o.monthQuantity), 0)", "subscriptionsSold")
				.addSelect(
					"COALESCE(SUM(ROUND(s.price * o.monthQuantity)), 0)",
					"revenueVnd",
				)
				.groupBy("s.id")
				.addGroupBy("s.subscriptionCode")
				.addGroupBy("s.subscriptionName")
				.addGroupBy("s.version")
				.orderBy("revenueVnd", "DESC")
				.getRawMany<{
					subscriptionId: string;
					subscriptionCode: string;
					subscriptionName: string;
					subscriptionVersion: string | number | null;
					ordersSold: string | number | null;
					subscriptionsSold: string | number | null;
					revenueVnd: string | number | null;
				}>(),
			base
				.clone()
				.select("DATE(o.createdAt)", "date")
				.addSelect("COUNT(o.id)", "ordersSold")
				.addSelect("COALESCE(SUM(o.monthQuantity), 0)", "subscriptionsSold")
				.addSelect(
					"COALESCE(SUM(ROUND(s.price * o.monthQuantity)), 0)",
					"revenueVnd",
				)
				.groupBy("DATE(o.createdAt)")
				.orderBy("date", "ASC")
				.getRawMany<{
					date: string;
					ordersSold: string | number | null;
					subscriptionsSold: string | number | null;
					revenueVnd: string | number | null;
				}>(),
		]);

		return {
			totalOrdersSold: Number(totalsRaw?.totalOrdersSold ?? 0),
			totalSubscriptionsSold: Number(totalsRaw?.totalSubscriptionsSold ?? 0),
			totalRevenueVnd: String(totalsRaw?.totalRevenueVnd ?? "0"),
			bySubscription: (bySubscriptionRaw ?? []).map((row) => ({
				subscriptionId: String(row.subscriptionId ?? ""),
				subscriptionCode: String(row.subscriptionCode ?? ""),
				subscriptionName: String(row.subscriptionName ?? ""),
				subscriptionVersion: Number(row.subscriptionVersion ?? 0),
				ordersSold: Number(row.ordersSold ?? 0),
				subscriptionsSold: Number(row.subscriptionsSold ?? 0),
				revenueVnd: String(row.revenueVnd ?? "0"),
			})),
			byDay: (byDayRaw ?? []).map((row) => ({
				date: String(row.date ?? ""),
				ordersSold: Number(row.ordersSold ?? 0),
				subscriptionsSold: Number(row.subscriptionsSold ?? 0),
				revenueVnd: String(row.revenueVnd ?? "0"),
			})),
		};
	}
}
