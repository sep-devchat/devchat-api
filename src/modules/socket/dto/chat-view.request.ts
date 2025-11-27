import { IsBoolean, IsEnum, IsString, ValidateIf } from "class-validator";

enum ChatViewType {
	GROUP = "group",
	DIRECT = "direct",
	THREAD = "thread",
}

export class ChatViewRequest {
	@IsEnum(ChatViewType)
	type: ChatViewType;

	@IsBoolean()
	active = true;

	@ValidateIf(
		(o) =>
			o.active &&
			(o.type === ChatViewType.GROUP || o.type === ChatViewType.THREAD),
	)
	@IsString()
	groupId?: string;

	@ValidateIf(
		(o) =>
			o.active &&
			(o.type === ChatViewType.GROUP || o.type === ChatViewType.THREAD),
	)
	@IsString()
	channelId?: string;

	@ValidateIf((o) => o.type === ChatViewType.DIRECT && o.active)
	@IsString()
	peerUserId?: string;

	@ValidateIf((o) => o.type === ChatViewType.THREAD && o.active)
	@IsString()
	threadId?: string;
}

export { ChatViewType };
