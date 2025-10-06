import { ApiProperty } from "@nestjs/swagger";
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
} from "class-validator";

/**
 * DTO representing the subset of Cloudinary direct-upload response we persist.
 * Incoming payload should map from the raw Cloudinary response keys.
 */
export class CloudinaryUploadSaveRequestDto {
	@ApiProperty({ description: "Cloudinary public_id" })
	@IsString()
	@IsNotEmpty()
	public_id: string;

	@ApiProperty({
		description: "Display name (Cloudinary display_name)",
		required: false,
	})
	@IsString()
	@IsOptional()
	display_name?: string;

	@ApiProperty({ description: "Original filename before upload" })
	@IsString()
	@IsNotEmpty()
	original_filename: string;

	@ApiProperty({ description: "Secure delivery URL" })
	@IsUrl()
	secure_url: string;

	@ApiProperty({ description: "Resource type: image / video / raw" })
	@IsString()
	@IsNotEmpty()
	resource_type: string;

	@ApiProperty({ description: "File size in bytes" })
	@IsNumber()
	bytes: number;

	@ApiProperty({ description: "Format/extension (e.g. png, webp)" })
	@IsString()
	@IsNotEmpty()
	format: string;

	@ApiProperty({ description: "Folder within Cloudinary", required: false })
	@IsString()
	@IsOptional()
	asset_folder?: string;

	@ApiProperty({
		description: "(Optional) Associated message ID",
		required: false,
	})
	@IsString()
	@IsOptional()
	messageId?: string;
}
