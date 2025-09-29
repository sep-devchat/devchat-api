import { Module } from "@nestjs/common";
import { MessageService } from "./message.service";
import { MessageController } from "./message.controller";
import { UserModule } from "@modules/user";

@Module({
	providers: [MessageService],
	imports: [UserModule],
	exports: [MessageService],
	controllers: [MessageController],
})
export class MessageModule {}
