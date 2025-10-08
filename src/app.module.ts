import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { Env, MyExceptionFilter, ValidationPipe } from "@utils";
import { DbModule } from "@db";
import { AuthGuard, AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";
import { ClsModule } from "nestjs-cls";
import { GitHubModule } from "@providers/github";
import { MessageModule } from "@modules/message";
import { SocketModule } from "@modules/socket";
import { ConfigModule } from "@nestjs/config";
import { CloudinaryModule } from "@providers/cloudinary";
import { AttachmentModule } from "@modules/attachment";
import { UploadModule } from "@modules/upload";
import { GroupModule } from "@modules/group";
import { UserGroupModule } from "@modules/user-group";
import { ChannelModule } from "@modules/channel";
import { ThreadModule } from "@modules/thread";
import { CodeModule } from "@modules/code";
import { AdminRoleModule } from "@modules/admin-role";
import { PermissionModule } from "@modules/permission";
import { UserFriendModule } from "@modules/user-friend";

@Module({
	imports: [
		DbModule,
		ClsModule.forRoot({
			global: true,
			middleware: {
				mount: true,
			},
		}),
		ConfigModule.forRoot({ isGlobal: true }),
		GitHubModule.register({
			clientId: Env.GITHUB_CLIENT_ID,
			clientSecret: Env.GITHUB_CLIENT_SECRET,
		}),
		AuthModule,
		UserModule,
		UserFriendModule,
		MessageModule,
		SocketModule,
		CloudinaryModule,
		AttachmentModule,
		UploadModule,
		GroupModule,
		UserGroupModule,
		ChannelModule,
		ThreadModule,
		CodeModule,
		AdminRoleModule,
		PermissionModule,
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
