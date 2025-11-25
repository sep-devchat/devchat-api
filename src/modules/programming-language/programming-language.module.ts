import { Module } from "@nestjs/common";
import { ProgrammingLanguageService } from "./programming-language.service";
import { ProgrammingLanguageController } from "./programming-language.controller";
import { SupportedProgrammingLanguageRepository } from "@db/repositories";

@Module({
	providers: [
		ProgrammingLanguageService,
		SupportedProgrammingLanguageRepository,
	],
	exports: [ProgrammingLanguageService, SupportedProgrammingLanguageRepository],
	controllers: [ProgrammingLanguageController],
})
export class ProgrammingLanguageModule {}
