import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UploadSignatureDto {
	@ApiPropertyOptional({
		description: "Target folder in Cloudinary",
		example: "devchat/avatars",
	})
	@IsOptional()
	@IsString()
	folder?: string;

	@ApiPropertyOptional({
		description: "Explicit public ID; if omitted Cloudinary will generate one",
		example: "user_123_avatar",
	})
	@IsOptional()
	@IsString()
	publicId?: string;

	@ApiPropertyOptional({
		description: "Eager transformations (pipe separated server-side)",
		example: ["c_fill,w_200,h_200,g:auto", "q_auto,f_auto"],
	})
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	eager?: string[];

	@ApiPropertyOptional({
		description: "Invalidate cached versions",
		example: false,
	})
	@IsOptional()
	@IsBoolean()
	invalidate?: boolean;
}

// response DTO moved to its own file
