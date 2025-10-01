import { Injectable } from "@nestjs/common";
import { AttachmentQuery } from "./dto";
import { AttachmentRepository } from "@db/repositories";
import { PaginationDto } from "@utils";
import { AttachmentResponse } from "./dto";

@Injectable()
export class AttachmentService {
	constructor(private readonly attachmentRepo: AttachmentRepository) {}

	async findMany(query: AttachmentQuery) {
		const page = Number(query.page || 1);
		const size = Number(query.size || 20);
		const [data, total] = await this.attachmentRepo.findAndCount({
			where: query.userId ? ({ uploadedBy: query.userId } as any) : {},
			order: { createdAt: "DESC" as const },
			skip: (page - 1) * size,
			take: size,
		});
		const pagination = new PaginationDto(page, size, total);
		return { data: AttachmentResponse.fromEntities(data as any), pagination };
	}

	async findOne(id: string) {
		const entity = await this.attachmentRepo.findOne({ where: { id } });
		return entity ? AttachmentResponse.fromEntity(entity as any) : null;
	}
}
