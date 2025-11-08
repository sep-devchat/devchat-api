import { IsNumber, IsOptional } from "class-validator";

export class FetchMessagesRequest {
	@IsNumber()
	@IsOptional()
	take?: number;

	@IsNumber()
	@IsOptional()
	page?: number;
}
