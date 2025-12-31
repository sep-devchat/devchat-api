import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { Env, MyExceptionFilter, ValidationPipe } from "@utils";
import { DbModule } from "@db";
import { AuthGuard, AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";
import { ClsModule } from "nestjs-cls";
import { GitHubModule } from "@providers/github";
import { SocketModule } from "@modules/socket";
import { MessageModule } from "./modules/message";
import { ConfigModule } from "@nestjs/config";
import { CloudinaryModule } from "@providers/cloudinary";
import { AttachmentModule } from "@modules/attachment";
import { UploadModule } from "@modules/upload";
import { GroupModule } from "@modules/group";
import { UserGroupModule } from "@modules/user-group";
import { ChannelModule } from "@modules/channel";
import { ThreadModule } from "@modules/thread";
import { CodeModule } from "@modules/code";
import { UserFriendModule } from "@modules/user-friend";
import { AuditLogInterceptor } from "./interceptors";
import { TaskModule } from "@modules/task";
import { TodoModule } from "@modules/todo";
import { CodeBlockModule } from "@modules/code-block";
import { FriendRequestModule } from "@modules/friend-request";
import { GroupInvitationModule } from "@modules/group-invitation";
import { NotificationModule } from "@modules/notification";
import { AiModule } from "@modules/ai/ai.module";
import { CodeCollaborationModule } from "@modules/code-collaboration";
import { UserScheduler } from "./schedulers";
import { ScheduleModule } from "@nestjs/schedule";
import { ProgrammingLanguageModule } from "@modules/programming-language";
import { UserLanguageCollectionModule } from "@modules/user-language-collection";
import { ReportCategoryModule } from "@modules/report-category";
import { ReportModule } from "@modules/report";
import { PaymentModule } from "@modules/payment";
import { AppController } from "./app.controller";
import { SubscriptionModule } from "@modules/subscription";
import { GroupSubscriptionModule } from "@modules/group-subscription";
import { TransactionModule } from "@modules/transaction";
import { ShareFundModule } from "@modules/share-fund";
import { GroupSupportedProgrammingLanguageModule } from "@modules/group-supported-programming-language";
import { OrderModule } from "@modules/order";

@Module({
	imports: [
		DbModule,
		ClsModule.forRoot({
			global: true,
			middleware: {
				mount: true,
			},
		}),
		ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
		GitHubModule.register({
			clientId: Env.GITHUB_CLIENT_ID,
			clientSecret: Env.GITHUB_CLIENT_SECRET,
		}),
		ScheduleModule.forRoot(),
		AuthModule,
		UserModule,
		UserFriendModule,
		SocketModule,
		MessageModule,
		CloudinaryModule,
		AttachmentModule,
		UploadModule,
		GroupModule,
		UserGroupModule,
		ChannelModule,
		ThreadModule,
		CodeModule,
		TaskModule,
		TodoModule,
		CodeBlockModule,
		FriendRequestModule,
		GroupInvitationModule,
		NotificationModule,
		AiModule,
		MessageModule,
		CodeCollaborationModule,
		ProgrammingLanguageModule,
		UserLanguageCollectionModule,
		ReportCategoryModule,
		ReportModule,
		PaymentModule,
		SubscriptionModule,
		GroupSubscriptionModule,
		TransactionModule,
		ShareFundModule,
		GroupSupportedProgrammingLanguageModule,
		OrderModule,
	],
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
		{
			provide: APP_INTERCEPTOR,
			useClass: AuditLogInterceptor,
		},
		UserScheduler,
	],
	controllers: [AppController],
})
export class AppModule {}
