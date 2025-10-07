export enum LoginMethodEnum {
	BASIC = "basic",
	GOOGLE = "google",
	GITHUB = "github",
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
