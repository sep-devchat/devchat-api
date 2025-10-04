import { Module } from "@nestjs/common";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { UserGroupModule } from "@modules/user-group";

@Module({
	providers: [GroupService],
	exports: [GroupService],
	controllers: [GroupController],
})
export class GroupModule {}
