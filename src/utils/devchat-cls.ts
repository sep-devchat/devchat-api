import { Profile } from "@modules/auth/dto";
import { ChannelResponse } from "@modules/channel/dto";
import { GroupResponse } from "@modules/group/dto";
import { ThreadResponse } from "@modules/thread/dto";
import { ClsStore } from "nestjs-cls";

export interface DevChatCls extends ClsStore {
	profile: Profile;
	group: GroupResponse;
	channel: ChannelResponse;
	thread: ThreadResponse;
}
