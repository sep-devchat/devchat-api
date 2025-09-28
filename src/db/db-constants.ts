export const DbConstants = {
	TableName: {
		User: "user",
		Group: "group",
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
