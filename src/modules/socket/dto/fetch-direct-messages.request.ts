import { IsUUID, IsNumber, IsOptional } from "class-validator";

export class FetchDirectMessagesRequest {
	@IsUUID()
	targetUserId: string;

	@IsNumber()
	@IsOptional()
	take?: number;

	@IsNumber()
	@IsOptional()
	page?: number;
}
