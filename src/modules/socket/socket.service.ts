import { MessageService } from "@modules/message";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SocketService {
	constructor(private readonly messageService: MessageService) {}
}
