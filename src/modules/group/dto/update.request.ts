import { PartialType } from "@nestjs/swagger";
import { CreateGroupRequest } from "./create.request";

export class UpdateGroupRequest extends PartialType(CreateGroupRequest) {}
