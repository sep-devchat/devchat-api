import { Module } from "@nestjs/common";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";

@Module({
	providers: [GroupService],
	exports: [GroupService],
	controllers: [GroupController],
})
export class GroupModule {}
