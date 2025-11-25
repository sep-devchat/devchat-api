import { PartialType } from "@nestjs/swagger";
import { CreateProgrammingLanguageRequest } from "./create.request";

export class UpdateProgrammingLanguageRequest extends PartialType(
	CreateProgrammingLanguageRequest,
) {}
