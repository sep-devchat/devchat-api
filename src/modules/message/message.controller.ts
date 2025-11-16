import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiResponseDto, SwaggerApiResponse } from "@utils";
import { Profile } from "@modules/auth/dto";
import { MessageService } from "./message.service";

@Controller("message")
export class MessageController {
	constructor(private readonly messageService: MessageService) {}

	@Get("direct/peers")
	@ApiBearerAuth()
	@SwaggerApiResponse(Profile, { isArray: true })
	async getDirectMessagePeers(): Promise<ApiResponseDto<Profile[]>> {
		const data = await this.messageService.getDirectMessagePeers();
		return new ApiResponseDto<Profile[]>(
			data,
			null,
			"Peers retrieved successfully",
		);
	}
}
