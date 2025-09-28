import { Module } from "@nestjs/common";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { UserModule } from "@modules/user";

@Module({
	providers: [GroupService],
	imports: [UserModule],
	exports: [GroupService],
	controllers: [GroupController],
})
export class GroupModule {}
