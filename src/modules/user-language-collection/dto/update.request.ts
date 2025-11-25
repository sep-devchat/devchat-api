import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateUserLanguageCollectionRequest } from "./create.request";
import { IsOptional } from "class-validator";

export class UpdateUserLanguageCollectionRequest extends PartialType(
	CreateUserLanguageCollectionRequest,
) {
	@ApiProperty({
		description: "Order index of the language in the user's collection",
		required: false,
	})
	@IsOptional()
	orderIndex?: number;
}
