import { Module } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import {
	AttachmentController,
	DirectAttachmentController,
} from "./attachment.controller";
import { DbModule } from "@db";
import { GroupModule } from "@modules/group";
import { ChannelModule } from "@modules/channel";

@Module({
	imports: [DbModule, GroupModule, ChannelModule],
	providers: [AttachmentService],
	exports: [AttachmentService],
	controllers: [AttachmentController, DirectAttachmentController],
})
export class AttachmentModule {}
