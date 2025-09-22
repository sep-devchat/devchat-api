import { PartialType } from "@nestjs/swagger";
import { UserRequest } from "./user.request";

export class UpdateUserRequest extends PartialType(UserRequest) {}
