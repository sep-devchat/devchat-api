import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { datasource } from "./datasource";
import { addTransactionalDataSource } from "typeorm-transactional";
import {
	MessageRepository,
	UserRepository,
	PasswordResetTokenRepository,
} from "./repositories";

const repositories = [
	UserRepository,
	MessageRepository,
	PasswordResetTokenRepository,
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
