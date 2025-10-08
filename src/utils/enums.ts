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
