import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { datasource } from "./datasource";
import { addTransactionalDataSource } from "typeorm-transactional";
import {
	GroupRepository,
	UserRepository,
	MessageRepository,
	UserMessageDeleteRepository,
	PasswordResetTokenRepository,
	AttachmentRepository,
	UserGroupRepository,
	ChannelRepository,
	ThreadRepository,
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
