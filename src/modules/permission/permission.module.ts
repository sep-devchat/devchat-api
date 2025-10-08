import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { PermissionController } from "./permission.controller";
import { DbModule } from "@db/db.module";
import { ClsModule } from "nestjs-cls";

@Module({
	imports: [DbModule, ClsModule],
	providers: [PermissionService],
	exports: [PermissionService],
	controllers: [PermissionController],
})
export class PermissionModule {}
