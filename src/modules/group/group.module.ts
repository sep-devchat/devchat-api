import { Module } from "@nestjs/common";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { TaskModule } from "@modules/task";

@Module({
	providers: [GroupService],
	imports: [TaskModule],
	exports: [GroupService],
	controllers: [GroupController],
})
export class GroupModule {}
