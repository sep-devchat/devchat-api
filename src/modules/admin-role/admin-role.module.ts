import { Module } from "@nestjs/common";
import { AdminRoleService } from "./admin-role.service";
import { AdminRoleController } from "./admin-role.controller";
import { DbModule } from "@db/db.module";
import { ClsModule } from "nestjs-cls";

@Module({
	imports: [DbModule, ClsModule],
	providers: [AdminRoleService],
	exports: [AdminRoleService],
	controllers: [AdminRoleController],
})
export class AdminRoleModule {}
