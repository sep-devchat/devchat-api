import { Module } from "@nestjs/common";
import { GroupSupportedProgrammingLanguageService } from "./group-supported-programming-language.service";
import { GroupSupportedProgrammingLanguageController } from "./group-supported-programming-language.controller";
import { GroupSupportedProgrammingLanguageRepository } from "@db/repositories";
import { GroupModule } from "@modules/group";

@Module({
	imports: [GroupModule],
	providers: [
		GroupSupportedProgrammingLanguageService,
		GroupSupportedProgrammingLanguageRepository,
	],
	exports: [GroupSupportedProgrammingLanguageService],
	controllers: [GroupSupportedProgrammingLanguageController],
})
export class GroupSupportedProgrammingLanguageModule {}
