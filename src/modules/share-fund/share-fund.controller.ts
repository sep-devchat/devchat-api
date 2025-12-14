import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiResponseDto } from "@utils";
import { ShareFundService } from "./share-fund.service";
import { ShareFundQuery } from "./dto";

@ApiTags("share-fund")
@Controller("share-fund")
export class ShareFundController {
	constructor(private readonly shareFundService: ShareFundService) {}

	@Get()
	@ApiOperation({
		summary: "List share funds",
		description: "Return share funds with optional filters",
	})
	async findMany(@Query() query: ShareFundQuery) {
		const data = await this.shareFundService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get share fund",
		description: "Fetch a share fund by id",
	})
	async findOne(@Param("id") id: string) {
		const data = await this.shareFundService.findOne(id);
		return new ApiResponseDto(data);
	}
}
