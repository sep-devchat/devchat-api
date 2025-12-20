import { ApiError } from "@errors";

export class GroupMemberLimitReachedError extends ApiError<{
	limitMembers: number;
	currentMembers: number;
	attemptingToAdd: number;
}> {
	constructor(
		limitMembers: number,
		currentMembers: number,
		attemptingToAdd = 1,
	) {
		super({
			code: "group_member_limit_reached",
			message: "Group member limit reached for the current subscription.",
			detail: { limitMembers, currentMembers, attemptingToAdd },
			status: 400,
		});
	}
}
