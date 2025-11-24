import { UserEntity } from "@db/entities";
import { UserLanguageCollectionResponse } from "@modules/user-language-collection";
import { ApiProperty } from "@nestjs/swagger";

export class Profile {
	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty({ required: false })
	avatarUrl?: string;

	@ApiProperty()
	isActive: boolean;

	@ApiProperty()
	emailVerified: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty({ required: false })
	lastLogin?: Date;

	@ApiProperty({ required: false })
	timezone?: string;

	@ApiProperty()
	isAdmin: boolean;

	@ApiProperty({ type: [UserLanguageCollectionResponse], required: false })
	userLanguages?: UserLanguageCollectionResponse[];

	static fromEntity(entity: UserEntity): Profile {
		return {
			id: entity.id,
			username: entity.username,
			email: entity.email,
			firstName: entity.firstName,
			lastName: entity.lastName,
			avatarUrl: entity.avatarUrl ?? undefined,
			isActive: entity.isActive,
			emailVerified: entity.emailVerified,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			lastLogin: entity.lastLogin ?? undefined,
			timezone: entity.timezone ?? undefined,
			isAdmin: entity.isAdmin,
			userLanguages: entity.userLanguages
				? entity.userLanguages.map((lang) =>
						UserLanguageCollectionResponse.fromEntity(lang),
					)
				: undefined,
		};
	}
}
