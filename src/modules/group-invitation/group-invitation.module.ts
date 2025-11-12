import { Module } from "@nestjs/common";
import { GroupInvitationService } from "./group-invitation.service";
import { GroupInvitationController } from "./group-invitation.controller";
import { UserModule } from "@modules/user";
import { GroupModule } from "@modules/group";
import { NotificationModule } from "@modules/notification";

@Module({
	imports: [UserModule, GroupModule, NotificationModule],
	providers: [GroupInvitationService],
	exports: [GroupInvitationService],
	controllers: [GroupInvitationController],
})
export class GroupInvitationModule {}
