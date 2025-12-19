import { UserEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserLanguageCollectionResponse } from "@modules/user-language-collection/dto";

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
		description: "Is user an admin",
	})
	isAdmin: boolean;

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

	@ApiProperty({
		description:
			"Ordered list of programming languages configured for the user",
		type: () => UserLanguageCollectionResponse,
		isArray: true,
	})
	userLanguages: UserLanguageCollectionResponse[];

	static fromEntity(entity: UserEntity): UserResponse {
		return {
			id: entity.id,
			username: entity.username,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			avatarUrl: entity.avatarUrl,
			isActive: entity.isActive,
			isAdmin: entity.isAdmin,
			emailVerified: entity.emailVerified,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			lastLogin: entity.lastLogin,
			timezone: entity.timezone,
			userLanguages: UserResponse.mapLanguages(entity),
		};
	}

	private static mapLanguages(
		entity: Pick<UserEntity, "userLanguages">,
	): UserLanguageCollectionResponse[] {
		if (!entity.userLanguages?.length) {
			return [];
		}

		return [...entity.userLanguages]
			.sort((a, b) => a.orderIndex - b.orderIndex)
			.map((language) => UserLanguageCollectionResponse.fromEntity(language));
	}

	static fromEntities(entities: UserEntity[]): UserResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
