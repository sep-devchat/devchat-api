import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiResponseDto, SwaggerApiResponse } from "@utils";
import { Profile } from "@modules/auth/dto";
import { MessageService } from "./message.service";
import {
	SearchMessagesRequest,
	SearchDirectMessagesRequest,
	SearchMessageResult,
	DirectMessageResponse,
} from "./dto";
import { PaginationDto } from "@utils";

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

	@Get("search")
	@ApiBearerAuth()
	@SwaggerApiResponse(SearchMessageResult, {
		isArray: true,
		withPagination: true,
	})
	async searchMessages(
		@Query() query: SearchMessagesRequest,
	): Promise<ApiResponseDto<SearchMessageResult[]>> {
		const { items, total } = await this.messageService.searchMessages(query);
		const pagination = new PaginationDto(
			query.page && query.page > 0 ? query.page : 1,
			query.take && query.take > 0 ? Math.min(query.take, 100) : 50,
			total,
		);
		return new ApiResponseDto<SearchMessageResult[]>(
			items,
			pagination,
			"Search completed successfully",
		);
	}

	@Get("direct/search")
	@ApiBearerAuth()
	@SwaggerApiResponse(DirectMessageResponse, {
		isArray: true,
		withPagination: true,
	})
	async searchDirectMessages(
		@Query() query: SearchDirectMessagesRequest,
	): Promise<ApiResponseDto<DirectMessageResponse[]>> {
		const { items, total } =
			await this.messageService.searchDirectMessages(query);
		const pagination = new PaginationDto(
			query.page && query.page > 0 ? query.page : 1,
			query.take && query.take > 0 ? Math.min(query.take, 100) : 50,
			total,
		);
		return new ApiResponseDto<DirectMessageResponse[]>(
			items,
			pagination,
			"Direct message search completed successfully",
		);
	}
}
