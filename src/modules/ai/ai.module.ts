import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { DbModule } from "@db";
import { AiUserSeeder } from "./ai.user-seeder";
import { GroupModule } from "@modules/group";

@Module({
	imports: [DbModule, GroupModule],
	controllers: [AiController],
	providers: [AiService, AiUserSeeder],
	exports: [AiService],
})
export class AiModule {}
