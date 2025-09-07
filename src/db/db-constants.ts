export const DbConstants = {
	TableName: {
		User: "user",
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
	},
	IndexName: {
		User: {
			username: "idx_user_unique_username",
			email: "idx_user_unique_email",
		},
	},
};
