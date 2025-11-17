import { OmitType } from "@nestjs/swagger";
import { CreateCodeCollaborationRequest } from "./create.request";

export class UpdateCodeCollaborationRequest extends OmitType(
	CreateCodeCollaborationRequest,
	["codeBlockId"],
) {}
