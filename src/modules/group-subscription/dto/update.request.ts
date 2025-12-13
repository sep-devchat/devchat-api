import { PartialType } from "@nestjs/swagger";
import { CreateGroupSubscriptionRequest } from "./create.request";

export class UpdateGroupSubscriptionRequest extends PartialType(
	CreateGroupSubscriptionRequest,
) {}
