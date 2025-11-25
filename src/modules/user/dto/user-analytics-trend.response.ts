import { ApiProperty } from "@nestjs/swagger";

export class UserAnalyticsTrendResponse {
	@ApiProperty({ description: "Label that should be displayed on the chart" })
	label: string;

	@ApiProperty({ description: "Bucket start in ISO string" })
	start: string;

	@ApiProperty({ description: "Bucket end in ISO string" })
	end: string;

	@ApiProperty({
		description: "Number of new users registered within the bucket",
	})
	registrations: number;

	@ApiProperty({
		description:
			"Number of active users (rolling 30-day window) at the end of the bucket",
	})
	activeUsers: number;

	@ApiProperty({
		description: "Number of successful logins recorded within the bucket",
	})
	logins: number;
}
