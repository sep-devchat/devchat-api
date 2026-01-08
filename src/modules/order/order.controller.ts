import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import {
	CreateOrderRequest,
	UpdateOrderRequest,
	OrderQuery,
	OrderReportOverviewQuery,
} from "./dto";
import { ApiResponseDto } from "@utils";

@Controller("order")
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Post()
	async createOne(@Body() dto: CreateOrderRequest) {
		await this.orderService.createOne(dto);
		return new ApiResponseDto(null, null, "Created order successfully");
	}

	@Get()
	async findMany(@Query() query: OrderQuery) {
		const result = await this.orderService.findMany(query);
		return new ApiResponseDto(result.data, result.pagination);
	}

	@Get("report/overview")
	async getReportOverview(@Query() query: OrderReportOverviewQuery) {
		const data = await this.orderService.getReportOverview(query);
		return new ApiResponseDto(
			data,
			null,
			"Order overview retrieved successfully",
		);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		const data = await this.orderService.findOne(id);
		return new ApiResponseDto(data);
	}
}
