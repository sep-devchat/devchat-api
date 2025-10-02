import { ApiProperty } from "@nestjs/swagger";

export class AttachmentQuery {
	@ApiProperty({ required: false })
	page?: number;

	@ApiProperty({ required: false })
	size?: number;

	@ApiProperty({ required: false })
	userId?: string;
}
