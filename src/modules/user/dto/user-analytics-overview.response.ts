import { ApiProperty } from "@nestjs/swagger";

export class UserAnalyticsOverviewResponse {
	@ApiProperty({ description: "Total number of non-bot users" })
	totalUsers: number;

	@ApiProperty({
		description: "Registrations counted in the viewer's current day",
	})
	dailyRegistrations: number;

	@ApiProperty({
		description: "Registrations counted in the viewer's current month",
	})
	monthlyRegistrations: number;

	@ApiProperty({ description: "Users that logged in within the last 30 days" })
	activeUsers: number;
}
