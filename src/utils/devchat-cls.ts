import { GroupEntity, ChannelEntity, ThreadEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ClsStore } from "nestjs-cls";

export interface DevChatCls extends ClsStore {
	profile: Profile;
	group: GroupEntity;
	channel: ChannelEntity;
	thread: ThreadEntity;
}
