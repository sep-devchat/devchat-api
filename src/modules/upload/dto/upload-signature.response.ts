import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UploadSignatureResponseDto {
	@ApiProperty({ description: "Cloud name", example: "devchat-cloud" })
	cloudName!: string;
	@ApiProperty({
		description: "API key used for the upload",
		example: "123456789012345",
	})
	apiKey!: string;
	@ApiProperty({
		description: "Unix timestamp used to generate signature",
		example: 1728200000,
	})
	timestamp!: number;
	@ApiProperty({
		description: "Signature generated from params + API secret",
		example: "ab12cd34ef5678901234abcdef",
	})
	signature!: string;
	@ApiPropertyOptional({
		description: "Folder (if provided)",
		example: "devchat/avatars",
	})
	folder?: string;
	@ApiPropertyOptional({
		description: "Public ID (if provided)",
		example: "user_123_avatar",
	})
	public_id?: string;
	@ApiPropertyOptional({
		description: "Eager transformation string if provided",
		example: "c_fill,w_200,h_200,g:auto|q_auto,f_auto",
	})
	eager?: string;
}
