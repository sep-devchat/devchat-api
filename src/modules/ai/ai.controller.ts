import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import {
	AskDto,
	AskResponseDto,
	StartSessionDto,
	AiProviderInfoDto,
} from "./dto";
import { ApiResponseDto, SwaggerApiResponse } from "@utils";
import { AuditLog } from "@utils";
import { AiInteractionEntity } from "@db/entities";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
	constructor(private readonly ai: AiService) {}

	@Get("providers")
	@ApiOperation({ summary: "List available AI providers" })
	@SwaggerApiResponse(AiProviderInfoDto)
	async listProviders() {
		const providers = this.ai.listProviders();
		return new ApiResponseDto(
			providers,
			null,
			"Successfully retrieved AI providers",
		);
	}

	@Post("session")
	@ApiOperation({ summary: "Start a new AI session" })
	@SwaggerApiResponse(AiInteractionEntity)
	async startSession(@Body() dto: StartSessionDto) {
		const session = await this.ai.startSession(dto);
		return new ApiResponseDto(session, null, "Successfully started AI session");
	}

	@Post("ask")
	@ApiOperation({ summary: "Ask the AI a question and get an answer" })
	@SwaggerApiResponse(AskResponseDto)
	@AuditLog({
		action: "AI_INTERACTION_CREATE",
		entityType: "AiInteraction",
		entity: AiInteractionEntity,
		captureResponse: true,
		pickBodyFields: ["prompt", "sessionId"],
	})
	async ask(@Body() dto: AskDto) {
		const { session, interaction, answer } = await this.ai.ask(dto);
		const data = {
			sessionId: session.id,
			interactionId: interaction.id,
			answer,
		};
		return new ApiResponseDto(data, null, "Successfully asked the AI");
	}
}
