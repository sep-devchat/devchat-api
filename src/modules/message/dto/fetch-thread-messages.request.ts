import { IsString, IsInt, IsOptional, Min } from "class-validator";

export class FetchThreadMessagesRequest {
	@IsString()
	threadId: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	take?: number;
}
