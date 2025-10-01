export const DbConstants = {
	TableName: {
		User: "user",
		Message: "message",
		Group: "group",
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
		Group: {
			id: "group_id",
			name: "name",
			description: "description",
			avatar: "avatar",
			createdBy: "created_by",
			createdAt: "created_at",
			updatedAt: "updated_at",
			isActive: "is_active",
		},
	},
	IndexName: {
		User: {
			username: "idx_user_unique_username",
			email: "idx_user_unique_email",
		},
		Group: {
			name: "idx_group_name",
		},
	},
};
