import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { ApiResponseDto, SwaggerApiResponse } from "@utils";
import { ShareFundService } from "./share-fund.service";
import {
	CreateShareFundRequest,
	DonateShareFundRequest,
	ShareFundInGroupResponse,
	ShareFundQuery,
} from "./dto";

@ApiTags("share-fund")
@Controller("group/:groupId/share-fund")
@ApiBearerAuth()
@ApiParam({ name: "groupId", description: "Group ID" })
export class GroupShareFundController {
	constructor(private readonly shareFundService: ShareFundService) {}

	@Post()
	@ApiOperation({
		summary: "Create share fund in group (Group Owner Only)",
		description: "Create a share fund for a group based on a subscription",
	})
	async createOne(
		@Param("groupId") groupId: string,
		@Body() dto: CreateShareFundRequest,
	) {
		const data = await this.shareFundService.createOne(groupId, dto);
		return new ApiResponseDto(data, null, "Created successfully");
	}

	@Get()
	@ApiOperation({
		summary: "List share funds in group",
		description:
			"Return share funds for a group with optional subscription filter",
	})
	@SwaggerApiResponse(ShareFundInGroupResponse, { isArray: true })
	async findMany(
		@Param("groupId") groupId: string,
		@Query() query: ShareFundQuery,
	) {
		const entities = await this.shareFundService.findManyInGroup(
			groupId,
			query,
		);
		const data = ShareFundInGroupResponse.fromEntities(entities);
		return new ApiResponseDto(data);
	}

	@Post(":shareFundId/donate")
	@ApiOperation({
		summary: "Donate to share fund",
		description: "Group members can donate VND amount to a share fund",
	})
	@ApiParam({ name: "shareFundId", description: "Share fund ID" })
	async donate(
		@Param("groupId") groupId: string,
		@Param("shareFundId") shareFundId: string,
		@Body() dto: DonateShareFundRequest,
	) {
		const data = await this.shareFundService.donate(groupId, shareFundId, dto);
		return new ApiResponseDto(data, null, "Donated successfully");
	}

	@Delete(":shareFundId")
	@ApiOperation({
		summary: "Delete share fund in group (Group Owner Only)",
		description:
			"Delete share fund only if it has no transactions/contributions",
	})
	@ApiParam({ name: "shareFundId", description: "Share fund ID" })
	async deleteOne(
		@Param("groupId") groupId: string,
		@Param("shareFundId") shareFundId: string,
	) {
		const data = await this.shareFundService.deleteOneInGroup(
			groupId,
			shareFundId,
		);
		return new ApiResponseDto(data, null, "Deleted successfully");
	}
}
