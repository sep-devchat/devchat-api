import { forwardRef, Module } from "@nestjs/common";
import { UserGroupService } from "./user-group.service";
import { UserGroupController } from "./user-group.controller";
import { GroupModule } from "@modules/group";
import { UserModule } from "@modules/user";

@Module({
	providers: [UserGroupService],
	imports: [GroupModule, UserModule],
	exports: [UserGroupService],
	controllers: [UserGroupController],
})
export class UserGroupModule {}
