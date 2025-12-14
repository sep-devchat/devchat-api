import { Module } from "@nestjs/common";
import { ShareFundService } from "./share-fund.service";
import { ShareFundController } from "./share-fund.controller";
import { GroupShareFundController } from "./group-share-fund.controller";
import { GroupModule } from "@modules/group";
import { UserGroupModule } from "@modules/user-group";

@Module({
	imports: [GroupModule, UserGroupModule],
	providers: [ShareFundService],
	exports: [ShareFundService],
	controllers: [ShareFundController, GroupShareFundController],
})
export class ShareFundModule {}
