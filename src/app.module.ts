import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { Env, MyExceptionFilter, ValidationPipe } from "@utils";
import { DbModule } from "@db";
import { AuthGuard, AuthModule } from "@modules/auth";
import { ClsModule } from "nestjs-cls";
import { GitHubModule } from "@providers/github";

@Module({
	imports: [
		DbModule,
		ClsModule.forRoot({
			global: true,
			middleware: {
				mount: true,
			},
		}),
		GitHubModule.register({
			clientId: Env.GITHUB_CLIENT_ID,
			clientSecret: Env.GITHUB_CLIENT_SECRET,
		}),
		AuthModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: MyExceptionFilter,
		},
		{
			provide: APP_PIPE,
			useClass: ValidationPipe,
		},
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
	],
})
export class AppModule {}
