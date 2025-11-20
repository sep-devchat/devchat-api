import { forwardRef, Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { UserModule } from "@modules/user";
import { GroupModule } from "@modules/group";
import { UserGroupModule } from "@modules/user-group";
import { GroupOwnerGuard } from "./guards/group-owner.guard";

@Module({
	providers: [TaskService, GroupOwnerGuard],
	imports: [UserModule, GroupModule, UserGroupModule],
	exports: [TaskService],
	controllers: [TaskController],
})
export class TaskModule {}
