import { ApiProperty } from "@nestjs/swagger";
import { MessageTypeEnum } from "@utils";

export class ReportAnalyticsSummaryResponse {
	@ApiProperty({ description: "Total number of reports stored in the system" })
	totalReports: number;

	@ApiProperty({
		description:
			"Reports created inside the selected range or the fallback rolling window",
	})
	recentReports: number;

	@ApiProperty({ description: "Number of distinct reporters" })
	uniqueReporters: number;

	@ApiProperty({
		description: "Most frequent report category label",
		example: "Spam",
		nullable: true,
	})
	topCategory: string | null;
}

export class ReportTrendPointResponse {
	@ApiProperty({ description: "Display label for the UI" })
	label: string;

	@ApiProperty({
		description: "ISO string representing day start in viewer timezone",
	})
	start: string;

	@ApiProperty({
		description: "ISO string representing day end in viewer timezone",
	})
	end: string;

	@ApiProperty({ description: "Number of reports recorded in the bucket" })
	reports: number;
}

export class ReportTypeDistributionResponse {
	@ApiProperty({ enum: MessageTypeEnum })
	type: MessageTypeEnum;

	@ApiProperty({ description: "Count of reports for the given type" })
	count: number;
}

export class ReportCategoryStatResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ description: "Total reports referencing the category" })
	count: number;
}

export class ReportReporterStatResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ nullable: true })
	email: string | null;

	@ApiProperty({ nullable: true })
	username: string | null;

	@ApiProperty({ description: "Number of reports filed by the reporter" })
	reports: number;
}
