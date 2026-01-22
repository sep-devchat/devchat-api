import { ApiProperty } from "@nestjs/swagger";

export class OrderReportOverviewSubscriptionStat {
	@ApiProperty({ example: "subscription-uuid" })
	subscriptionId: string;

	@ApiProperty({ example: "PRO" })
	subscriptionCode: string;

	@ApiProperty({ example: "Pro Plan" })
	subscriptionName: string;

	@ApiProperty({ description: "Subscription version", example: 1 })
	subscriptionVersion: number;

	@ApiProperty({ description: "Number of PAID orders for this subscription" })
	ordersSold: number;

	@ApiProperty({
		description:
			"Total subscriptions sold for this subscription (sum of monthQuantity)",
	})
	subscriptionsSold: number;

	@ApiProperty({
		description:
			"Revenue in VND for this subscription (subscription.price * monthQuantity)",
		example: "150000",
	})
	revenueVnd: string;
}

export class OrderReportOverviewDailyStat {
	@ApiProperty({
		description: "UTC date bucket derived from order.createdAt",
		example: "2025-01-03",
	})
	date: string;

	@ApiProperty({ description: "Number of PAID orders in this date bucket" })
	ordersSold: number;

	@ApiProperty({ description: "Sum of monthQuantity in this date bucket" })
	subscriptionsSold: number;

	@ApiProperty({
		description:
			"Revenue in VND in this date bucket (subscription.price * monthQuantity)",
		example: "150000",
	})
	revenueVnd: string;
}

export class OrderReportOverviewResponse {
	@ApiProperty({ description: "Total number of sold (PAID) orders" })
	totalOrdersSold: number;

	@ApiProperty({
		description:
			"Total subscriptions sold (sum of monthQuantity for PAID orders)",
	})
	totalSubscriptionsSold: number;

	@ApiProperty({
		description:
			"Total revenue for sold orders (computed from subscription.price * monthQuantity)",
		example: "150000",
	})
	totalRevenueVnd: string;

	@ApiProperty({
		description: "Breakdown by subscription (for charts)",
		type: () => [OrderReportOverviewSubscriptionStat],
	})
	bySubscription: OrderReportOverviewSubscriptionStat[];

	@ApiProperty({
		description: "Daily breakdown (for charts)",
		type: () => [OrderReportOverviewDailyStat],
	})
	byDay: OrderReportOverviewDailyStat[];
}
