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

/**
 * Represents the priority levels for todo items.
 *
 * Each priority indicates the urgency and importance of the todo:
 * - `LOW`: Low priority tasks that can be completed when time permits
 * - `MEDIUM`: Medium priority tasks that should be completed in a reasonable timeframe
 * - `HIGH`: High priority tasks that require immediate or urgent attention
 */
export enum TodoPriorityEnum {
	LOW = 0,
	MEDIUM = 1,
	HIGH = 2,
}

/**
 * Represents the current status of a todo item in its workflow.
 *
 * Each status indicates the current state of the todo:
 * - `TODO`: Task is created and pending to be started
 * - `IN_PROGRESS`: Task is currently being worked on
 * - `DONE`: Task has been completed successfully
 */
export enum TodoStatusEnum {
	TODO = 0,
	IN_PROGRESS = 1,
	DONE = 2,
}

export enum AIProviderEnum {
	OPENAI = "openai",
	GEMINI = "gemini",
}

/**
 * Types of AI requests that can be made.
 * - `CHAT`: General chat interactions.
 * - `SUGGEST`: Requests for suggestions or recommendations.
 * - `EXPLAIN`: Requests for explanations or clarifications.
 * - `REFACTOR`: Requests for code refactoring or improvements.
 */
export enum AIRequestTypeEnum {
	CHAT = "chat",
	SUGGEST = "suggest",
	EXPLAIN = "explain",
	REFACTOR = "refactor",
}
