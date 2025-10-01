import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UploadFileRequest {
	@ApiProperty({ type: "string", format: "binary" })
	file: Express.Multer.File;

	@ApiProperty({
		required: false,
		description: "Message ID to associate the attachment with",
	})
	@IsOptional()
	messageId?: string;

	@ApiProperty({ required: false, description: "Folder to upload the file to" })
	@IsOptional()
	folder?: string;
}
