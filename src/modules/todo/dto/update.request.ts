import { PartialType } from "@nestjs/swagger";
import { CreateTodoRequest } from "./create.request";

export class UpdateTodoRequest extends PartialType(CreateTodoRequest) {}
