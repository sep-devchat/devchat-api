import { Module } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { AttachmentController } from "./attachment.controller";
import { DbModule } from "@db";

@Module({
	imports: [DbModule],
	providers: [AttachmentService],
	exports: [AttachmentService],
	controllers: [AttachmentController],
})
export class AttachmentModule {}
