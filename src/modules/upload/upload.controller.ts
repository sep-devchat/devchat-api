import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { UploadService } from "./upload.service";
import { CreateUploadRequest, UpdateUploadRequest, UploadQuery } from "./dto";
import { ApiMessageResponseDto, ApiResponseDto, SkipAuth } from "@utils";
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadFileRequest } from "./dto/upload-file.request";

@ApiTags("Upload")
@ApiBearerAuth()
@Controller("upload")
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post("attachment")
	@SkipAuth()
	@ApiOperation({ summary: "Upload attachment for message" })
	@UseInterceptors(FileInterceptor("file"))
	@ApiConsumes("multipart/form-data")
	@ApiBody({ type: UploadFileRequest })
	async uploadAttachment(
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: UploadFileRequest,
	) {
		await this.uploadService.uploadAttachment(file, dto.folder, dto.messageId);
		return new ApiMessageResponseDto("File uploaded successfully");
	}

	@Delete("attachment/:publicId")
	async deleteAttachment(@Param("publicId") publicId: string) {
		await this.uploadService.deleteAttachment(publicId);
		return new ApiMessageResponseDto("File deleted successfully");
	}
}
