import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { UploadController } from "./upload.controller";
import { CloudinaryModule } from "@providers/cloudinary";

@Module({
	imports: [CloudinaryModule],
	providers: [UploadService],
	exports: [UploadService],
	controllers: [UploadController],
})
export class UploadModule {}
