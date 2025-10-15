export enum LoginMethodEnum {
	BASIC = "basic",
	GOOGLE = "google",
	GITHUB = "github",
}

export enum InvitationStatus {
	PENDING = 0,
	ACCEPTED = 1,
	DECLINED = 2,
}

export enum AdminPermissionEnum {
	MANAGE_USERS = "MANAGE_USERS",
	MANAGE_GROUPS = "MANAGE_GROUPS",
	MODERATE_MESSAGES = "MODERATE_MESSAGES",
	MANAGE_ROLES = "MANAGE_ROLES",
	MANAGE_PERMISSIONS = "MANAGE_PERMISSIONS",
}
/**
 * Represents the status of a friend request between two users.
 *
 * Each status indicates the current state of the relationship:
 * - `PENDING`: A friend request has been sent but not yet responded to.
 * - `ACCEPTED`: The friend request has been accepted; users are now friends.
 * - `DECLINED`: The friend request has been declined.
 * - `CANCELLED`: The request or friendship has been cancelled or removed.
 */
export enum FriendRequestStatus {
	PENDING = 0,
	ACCEPTED = 1,
	DECLINED = 2,
	CANCELLED = 3,
}

export enum TaskStatusEnum {
	TODO = 0,
	IN_PROGRESS = 1,
	DONE = 2,
}

export enum TaskPriorityEnum {
	LOW = 0,
	MEDIUM = 1,
	HIGH = 2,
}
