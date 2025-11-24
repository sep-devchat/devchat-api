import { Module } from "@nestjs/common";
import { UserLanguageCollectionService } from "./user-language-collection.service";
import { UserLanguageCollectionController } from "./user-language-collection.controller";
import { UserLanguageCollectionRepository } from "@db/repositories";

@Module({
	providers: [UserLanguageCollectionService, UserLanguageCollectionRepository],
	exports: [UserLanguageCollectionService],
	controllers: [UserLanguageCollectionController],
})
export class UserLanguageCollectionModule {}
