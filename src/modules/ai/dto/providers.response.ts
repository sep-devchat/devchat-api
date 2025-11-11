import { ApiProperty } from "@nestjs/swagger";
import { AIProviderEnum } from "@utils";

export class AiProviderInfoDto {
	@ApiProperty({ enum: AIProviderEnum })
	provider: AIProviderEnum;

	@ApiProperty({ description: "Human-friendly provider label" })
	label: string;

	@ApiProperty({
		description: "Whether provider is available (API key configured)",
	})
	available: boolean;

	@ApiProperty({
		description: "Configured default model name (from env if set)",
		required: false,
		nullable: true,
	})
	configuredModel?: string | null;

	@ApiProperty({
		description: "SDK fallback model name used when none configured",
		required: false,
		nullable: true,
	})
	fallbackModel?: string | null;
}
