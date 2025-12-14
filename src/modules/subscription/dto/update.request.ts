import { PartialType } from "@nestjs/swagger";
import { CreateSubscriptionRequest } from "./create.request";

export class UpdateSubscriptionRequest extends PartialType(
	CreateSubscriptionRequest,
) {}
