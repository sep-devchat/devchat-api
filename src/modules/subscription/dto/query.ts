import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class SubscriptionQuery {
	@ApiPropertyOptional({
		description: "Filter subscriptions by active state",
		example: true,
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === "") return undefined;
		if (typeof value === "boolean") return value;
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (normalized === "true") return true;
			if (normalized === "false") return false;
		}
		return value;
	})
	@IsBoolean()
	isActive?: boolean;
}
