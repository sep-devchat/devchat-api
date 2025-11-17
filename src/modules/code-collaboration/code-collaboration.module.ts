import { Module } from "@nestjs/common";
import { CodeCollaborationService } from "./code-collaboration.service";
import { CodeCollaborationController } from "./code-collaboration.controller";
import { CodeBlockModule } from "@modules/code-block";

@Module({
	imports: [CodeBlockModule],
	providers: [CodeCollaborationService],
	exports: [CodeCollaborationService],
	controllers: [CodeCollaborationController],
})
export class CodeCollaborationModule {}
