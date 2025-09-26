import { PartialType } from "@nestjs/swagger";
import { CreateUserRequest } from "./create-user.request";

export class UpdateUserRequest extends PartialType(CreateUserRequest) {}
