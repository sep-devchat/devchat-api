import { ApiProperty } from "@nestjs/swagger";

export class ProgrammingLanguageResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	languageCode: string;

	@ApiProperty()
	languageName: string;

	@ApiProperty({ required: false })
	languageVersion?: string | null;

	@ApiProperty({ required: false })
	syntaxHighlighting?: string | null;

	@ApiProperty()
	codeExecutions: number;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}
