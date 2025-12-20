import { Controller, Param, Query, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import { TransactionQuery, TransactionResponse } from "./dto";
import { ApiResponseDto } from "@utils";

@ApiTags("transaction")
@Controller("transaction")
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@Get()
	@ApiOperation({
		summary: "List transactions",
		description: "Return transactions with optional filters",
	})
	async findMany(@Query() query: TransactionQuery) {
		const result = await this.transactionService.findMany(query);
		return new ApiResponseDto(
			TransactionResponse.fromEntities(result.data),
			result.pagination,
		);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get transaction",
		description: "Fetch a transaction by id",
	})
	async findOne(@Param("id") id: string) {
		const data = await this.transactionService.findOne(id);
		return new ApiResponseDto(TransactionResponse.fromEntity(data));
	}
}
