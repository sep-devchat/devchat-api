import { UserEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "User ID",
	})
	id: string;

	@ApiProperty({
		example: "john_doe",
		description: "Username",
	})
	username: string;

	@ApiProperty({
		example: "john@example.com",
		description: "Email address",
	})
	email: string;

	@ApiProperty({
		example: "John",
		description: "First name",
	})
	firstName: string;

	@ApiProperty({
		example: "Doe",
		description: "Last name",
	})
	lastName: string;

	@ApiPropertyOptional({
		example: "https://example.com/avatar.jpg",
		description: "Avatar URL",
	})
	avatarUrl: string | null;

	@ApiProperty({
		example: true,
		description: "Is user active",
	})
	isActive: boolean;

	@ApiProperty({
		example: false,
		description: "Is email verified",
	})
	emailVerified: boolean;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Creation date",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Last update date",
	})
	updatedAt: Date;

	@ApiPropertyOptional({
		example: "2024-01-01T12:00:00.000Z",
		description: "Last login date",
	})
	lastLogin: Date | null;

	@ApiPropertyOptional({
		example: "UTC",
		description: "User timezone",
	})
	timezone: string | null;

	static fromEntity(entity: UserEntity): UserResponse {
		return {
			id: entity.id,
			username: entity.username,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			avatarUrl: entity.avatarUrl,
			isActive: entity.isActive,
			emailVerified: entity.emailVerified,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			lastLogin: entity.lastLogin,
			timezone: entity.timezone,
		};
	}

	static fromEntities(entities: UserEntity[]): UserResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
