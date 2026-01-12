import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional } from "class-validator";

const BOOLEAN_QUERY_TRANSFORM = ({
	value,
	obj,
	key,
}: {
	value: unknown;
	obj: unknown;
	key: string;
}) => {
	// NOTE: class-transformer implicit conversion will turn "false" into true
	// because Boolean("false") === true. We must prefer the raw query value.
	const raw = (obj as any)?.[key];
	const candidate =
		raw === undefined || raw === null || raw === "" ? value : raw;

	if (candidate === undefined || candidate === null || candidate === "") {
		return undefined;
	}
	if (typeof candidate === "boolean") return candidate;
	if (typeof candidate === "number") {
		if (candidate === 1) return true;
		if (candidate === 0) return false;
		return candidate;
	}
	if (typeof candidate === "string") {
		const normalized = candidate.trim().toLowerCase();
		if (normalized === "true" || normalized === "1") return true;
		if (normalized === "false" || normalized === "0") return false;
		return candidate;
	}
	return candidate;
};

export const SUBSCRIPTION_SORT_BY_FIELDS = [
	"limitMembers",
	"runCodePerDay",
	"programmingLanguageInGroups",
] as const;

export type SubscriptionSortBy = (typeof SUBSCRIPTION_SORT_BY_FIELDS)[number];
export type SortOrder = "ASC" | "DESC";

export class SubscriptionQuery {
	@ApiPropertyOptional({
		description: "Filter subscriptions by active state",
		example: true,
	})
	@IsOptional()
	@Transform(BOOLEAN_QUERY_TRANSFORM)
	@IsBoolean()
	isActive?: boolean;

	@ApiPropertyOptional({
		description: "Filter subscriptions by AI entitlement",
		example: true,
	})
	@IsOptional()
	@Transform(BOOLEAN_QUERY_TRANSFORM)
	@IsBoolean()
	isAIActive?: boolean;

	@ApiPropertyOptional({
		description:
			"Sort field (limitMembers | runCodePerDay | programmingLanguageInGroups)",
		example: "limitMembers",
	})
	@IsOptional()
	@IsIn(SUBSCRIPTION_SORT_BY_FIELDS)
	sortBy?: SubscriptionSortBy;

	@ApiPropertyOptional({
		description: "Sort order (ASC | DESC)",
		example: "ASC",
		default: "ASC",
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === "") return undefined;
		if (typeof value !== "string") return value;
		const normalized = value.trim().toUpperCase();
		return normalized;
	})
	@IsIn(["ASC", "DESC"])
	sortOrder?: SortOrder;
}
