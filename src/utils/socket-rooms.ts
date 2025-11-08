export function constructRoomName(groupId: string, channelId: string) {
	return `group_${groupId}:channel_${channelId}`;
}

export function constructUserRoomName(userId: string) {
	return `user:${userId}`;
}
