import { ApiProperty } from "@nestjs/swagger";

export class UserLoginStatsResponse {
	@ApiProperty({ description: "The period label shown in the UI" })
	periodLabel: string;

	@ApiProperty({ description: "Successful login count for the period" })
	successfulLogins: number;

	@ApiProperty({
		description: "Peak hour window inside the period",
		nullable: true,
	})
	peakHour: string | null;
}
