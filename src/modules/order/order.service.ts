import { Injectable } from "@nestjs/common";
import {
	CreateOrderRequest,
	UpdateOrderRequest,
	OrderQuery,
	OrderResponse,
} from "./dto";
import {
	GroupRepository,
	GroupSubscriptionRepository,
	OrderRepository,
	SubscriptionRepository,
} from "@db/repositories";
import { PaginationDto } from "@utils";

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

		const allowedSortBy = new Set(["createdAt", "orderCode", "orderStatus"]);
		const sortBy = allowedSortBy.has(String(query?.sortBy))
			? (String(query?.sortBy) as "createdAt" | "orderCode" | "orderStatus")
			: "createdAt";
		const sortOrder = query?.sortOrder === "ASC" ? "ASC" : "DESC";

		const [orders, totalRecord] = await this.orderRepository.findAndCount({
			where: groupId ? { groupId } : undefined,
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
}
