import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { datasource } from "./datasource";
import { addTransactionalDataSource } from "typeorm-transactional";
import {
	UserRepository,
	MessageRepository,
	UserMessageDeleteRepository,
	PasswordResetTokenRepository,
	AttachmentRepository,
	UserGroupRepository,
	ChannelRepository,
	ThreadRepository,
	GroupRepository,
	AdminRoleRepository,
	PermissionRepository,
	UserFriendRepository,
	AuditLogRepository,
	TaskRepository,
	TodoRepository,
	CodeBlockRepository,
	AiSessionRepository,
	AiInteractionRepository,
} from "./repositories";

const repositories = [
	UserRepository,
	MessageRepository,
	GroupRepository,
	UserMessageDeleteRepository,
	PasswordResetTokenRepository,
	AttachmentRepository,
	UserGroupRepository,
	ChannelRepository,
	ThreadRepository,
	AdminRoleRepository,
	PermissionRepository,
	UserFriendRepository,
	AuditLogRepository,
	TaskRepository,
	TodoRepository,
	CodeBlockRepository,
	AiSessionRepository,
	AiInteractionRepository,
];

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: () => datasource.options,
			dataSourceFactory: async () => addTransactionalDataSource(datasource),
		}),
	],
	providers: [...repositories],
	exports: [...repositories],
})
@Global()
export class DbModule {}
