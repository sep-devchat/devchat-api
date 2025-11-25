import { PartialType } from "@nestjs/swagger";
import { CreateReportCategoryRequest } from "./create.request";

export class UpdateReportCategoryRequest extends PartialType(
	CreateReportCategoryRequest,
) {}
