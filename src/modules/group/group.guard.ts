import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { DevChatCls } from "@utils";
import { ClsService } from "nestjs-cls";
import { GroupService } from "./group.service";
import { GroupNotExistedError } from "./errors";

@Injectable()
export class GroupGuard implements CanActivate {
	constructor(
		private readonly cls: ClsService<DevChatCls>,
		private readonly groupService: GroupService,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const groupId = request.params.groupId;
		if (!groupId) throw new GroupNotExistedError();
		const group = await this.groupService.findOne(groupId);
		this.cls.set("group", group);
		return true;
	}
}
