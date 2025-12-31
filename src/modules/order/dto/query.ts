import { ApiProperty } from "@nestjs/swagger";

export class OrderQuery {
	@ApiProperty({ required: false, example: 1 })
	page?: number;

	@ApiProperty({ required: false, example: 10 })
	limit?: number;

	@ApiProperty({ required: false, example: "createdAt" })
	sortBy?: string;

	@ApiProperty({ required: false, example: "ASC" })
	sortOrder?: "ASC" | "DESC";

	@ApiProperty({ required: false, example: "group-uuid" })
	groupId?: string;
}
