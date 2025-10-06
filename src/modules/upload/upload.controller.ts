import {
	Controller,
	Param,
	Body,
	Post,
	Delete,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { UploadService } from "./upload.service";
import {
	CreateUploadRequest,
	DeliverySignatureDto,
	DeliverySignatureResponseDto,
	UpdateUploadRequest,
	UploadQuery,
	UploadSignatureDto,
	UploadSignatureResponseDto,
} from "./dto"; // (possibly unused now)
import { ApiMessageResponseDto, ApiResponseDto, SkipAuth } from "@utils";
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiTags,
	ApiOkResponse,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadFileRequest } from "./dto/upload-file.request";
import { CloudinaryService } from "@providers/cloudinary";
import { CloudinaryUploadSaveRequestDto } from "./dto";

@ApiBearerAuth()
@Controller("upload")
export class UploadController {
	constructor(
		private readonly uploadService: UploadService,
		private readonly cloudinaryService: CloudinaryService,
	) {}

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

	// Moved from CloudinaryController
	@Post("sign-upload")
	@SkipAuth()
	@ApiOperation({
		summary: "Generate signature & parameters for direct upload",
	})
	@ApiOkResponse({ type: UploadSignatureResponseDto })
	getUploadSignature(
		@Body() body: UploadSignatureDto,
	): ApiResponseDto<UploadSignatureResponseDto> {
		const data = this.cloudinaryService.generateUploadSignature(
			body,
		) as UploadSignatureResponseDto;
		return new ApiResponseDto<UploadSignatureResponseDto>(
			data,
			null,
			"Upload successfully",
		);
	}

	@Post("sign-delivery")
	@SkipAuth()
	@ApiOperation({ summary: "Generate signed delivery URL for a public asset" })
	@ApiOkResponse({ type: DeliverySignatureResponseDto })
	getDeliverySignature(
		@Body() body: DeliverySignatureDto,
	): ApiResponseDto<DeliverySignatureResponseDto> {
		const transformation = body.transformations ?? body.transformation;
		const data = this.cloudinaryService.generateSignedDeliveryUrl({
			publicId: body.publicId,
			transformation,
			format: body.format,
		}) as DeliverySignatureResponseDto;
		return new ApiResponseDto<DeliverySignatureResponseDto>(
			data,
			null,
			"Delivery signature generated successfully",
		);
	}

	@Post("save-data")
	@SkipAuth()
	@ApiOperation({
		summary: "Save a direct Cloudinary upload response to database",
	})
	@ApiBody({ type: CloudinaryUploadSaveRequestDto })
	@ApiOkResponse({ type: ApiMessageResponseDto })
	async saveCloudinaryUpload(@Body() body: CloudinaryUploadSaveRequestDto) {
		await this.uploadService.saveCloudinaryUpload(body);
		return new ApiMessageResponseDto("Cloudinary upload saved successfully");
	}
}
