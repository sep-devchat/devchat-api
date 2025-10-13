import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ThreadService } from "./thread.service";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { ThreadNotExistedError } from "./errors";

@Injectable()
export class ThreadGuard implements CanActivate {
	constructor(
		private readonly threadService: ThreadService,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();

		const threadId = request.params.threadId || request.query.threadId;
		if (!threadId) throw new ThreadNotExistedError();
		const thread = await this.threadService.findOne(threadId);
		this.cls.set("thread", thread);

		return true;
	}
}
