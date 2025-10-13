import { PartialType } from "@nestjs/swagger";
import { CreateTaskRequest } from "./create.request";

export class UpdateTaskRequest extends PartialType(CreateTaskRequest) {}
