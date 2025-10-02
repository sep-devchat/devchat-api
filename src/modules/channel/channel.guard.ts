import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { ChannelService } from "./channel.service";
import { ChannelNotExistedError } from "./errors";

@Injectable()
export class ChannelGuard implements CanActivate {
	constructor(
		private readonly cls: ClsService<DevChatCls>,
		private readonly channelService: ChannelService,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const channelId: string = request.params.id || request.params.channelId;
		if (!channelId) throw new ChannelNotExistedError();
		const channel = await this.channelService.findOne(channelId);
		this.cls.set("channel", channel);
		return true;
	}
}
