import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { datasource } from "./datasource";
import { addTransactionalDataSource } from "typeorm-transactional";
import {
	MessageRepository,
	UserMessageDeleteRepository,
	UserRepository,
} from "./repositories";

const repositories = [
	UserRepository,
	MessageRepository,
	UserMessageDeleteRepository,
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
