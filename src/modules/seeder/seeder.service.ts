import { Injectable } from "@nestjs/common";
import {
	ChannelSeederService,
	CodeCollaborationSeederService,
	GroupSeederService,
	MessageSeederService,
	NotificationSeederService,
	ReportCategorySeederService,
	ReportSeederService,
	ThreadSeederService,
	TaskSeederService,
	UserSeederService,
} from "./services";

@Injectable()
export class SeederService {
	constructor(
		private readonly groupSeederService: GroupSeederService,
		private readonly channelSeederService: ChannelSeederService,
		private readonly userSeederService: UserSeederService,
		private readonly threadSeederService: ThreadSeederService,
		private readonly messageSeederService: MessageSeederService,
		private readonly taskSeederService: TaskSeederService,
		private readonly reportCategorySeederService: ReportCategorySeederService,
		private readonly reportSeederService: ReportSeederService,
		private readonly codeCollaborationSeederService: CodeCollaborationSeederService,
		private readonly notificationSeederService: NotificationSeederService,
	) {}

	async run() {
		await this.userSeederService.run();
		await this.groupSeederService.run();
		await this.channelSeederService.run();
		await this.threadSeederService.run();
		await this.messageSeederService.run();
		await this.taskSeederService.run();
		await this.reportCategorySeederService.run();
		await this.reportSeederService.run();
		await this.codeCollaborationSeederService.run();
		await this.notificationSeederService.run();
	}
}
