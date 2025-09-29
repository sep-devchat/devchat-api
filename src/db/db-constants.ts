export const DbConstants = {
	TableName: {
		User: "user",
		Message: "message",
		UserMessageDelete: "user_message_delete",
	},
	ColumnName: {
		User: {
			id: "user_id",
			username: "username",
			email: "email",
			password: "password",
			firstName: "first_name",
			lastName: "last_name",
			avatarUrl: "avatar_url",
			isActive: "is_active",
			emailVerified: "email_verified",
			createdAt: "created_at",
			updatedAt: "updated_at",
			lastLogin: "last_login",
			timezone: "timezone",
		},
		Message: {
			id: "message_id",
			channelId: "channel_id",
			threadId: "thread_id",
			senderId: "sender_id",
			content: "content",
			parentMessageId: "parent_message_id",
		},
		UserMessageDelete: {
			id: "user_message_delete_id",
			userId: "user_id",
			messageId: "message_id",
		},
		Audit: {
			createdAt: "created_at",
			updatedAt: "updated_at",
			deletedAt: "deleted_at",
		},
	},
	IndexName: {
		User: {
			username: "idx_user_unique_username",
			email: "idx_user_unique_email",
		},
	},
};
