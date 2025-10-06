import {
	IsArray,
	IsObject,
	IsOptional,
	IsString,
	ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// We accept either a single transformation object or an array of them (Cloudinary style)
export class DeliverySignatureDto {
	@ApiProperty({
		description: "Cloudinary public ID",
		example: "devchat/avatars/user_123_avatar",
	})
	@IsString()
	publicId!: string;

	@ApiPropertyOptional({
		description:
			"Single transformation object (exclusive with transformations array)",
		example: { width: 256, height: 256, crop: "fill", gravity: "auto" },
	})
	@IsOptional()
	@IsObject()
	@ValidateIf((o) => !o.transformations)
	transformation?: Record<string, any>;

	@ApiPropertyOptional({
		description:
			"Array of transformation objects (exclusive with transformation)",
		example: [
			{ width: 256, height: 256, crop: "fill", gravity: "auto" },
			{ effect: "sharpen" },
		],
	})
	@IsOptional()
	@IsArray()
	@ValidateIf((o) => !o.transformation)
	transformations?: Record<string, any>[];

	@ApiPropertyOptional({
		description: "Output format override",
		example: "webp",
	})
	@IsOptional()
	@IsString()
	format?: string;
}

// response DTO moved to its own file
