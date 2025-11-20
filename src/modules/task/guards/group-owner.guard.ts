import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { NotGroupOwnerError } from "../errors";

@Injectable()
export class GroupOwnerGuard implements CanActivate {
	constructor(private readonly cls: ClsService<DevChatCls>) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const profile = this.cls.get("profile");
		const group = this.cls.get("group");

		if (!profile || !group) {
			throw new NotGroupOwnerError();
		}

		// Check if the current user is the group owner (creator)
		if (group.createdBy !== profile.id) {
			throw new NotGroupOwnerError();
		}

		return true;
	}
}
