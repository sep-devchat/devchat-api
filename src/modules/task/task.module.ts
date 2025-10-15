import { forwardRef, Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { UserModule } from "@modules/user";
import { GroupModule } from "@modules/group";
import { UserGroupModule } from "@modules/user-group";

@Module({
	providers: [TaskService],
	imports: [UserModule, GroupModule, UserGroupModule],
	exports: [TaskService],
	controllers: [TaskController],
})
export class TaskModule {}
