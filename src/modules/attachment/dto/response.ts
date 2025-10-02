import { ApiProperty } from "@nestjs/swagger";
import { AttachmentEntity } from "@db/entities";

export class AttachmentResponse {
	@ApiProperty()
	id: string;

	@ApiProperty({ nullable: true })
	messageId: string | null;

	@ApiProperty()
	fileName: string;

	@ApiProperty()
	originalFileName: string;

	@ApiProperty()
	filePath: string;

	@ApiProperty()
	fileSize: number;

	@ApiProperty()
	fileType: string;

	@ApiProperty()
	folder: string;

	@ApiProperty()
	format: string;

	@ApiProperty()
	publicId: string;

	@ApiProperty({ nullable: true })
	uploadedBy: string | null;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	static fromEntity(entity: AttachmentEntity): AttachmentResponse {
		const r = new AttachmentResponse();
		r.id = entity.id;
		r.messageId = entity.messageId ?? null;
		r.fileName = entity.fileName;
		r.originalFileName = entity.originalFileName;
		r.filePath = entity.filePath;
		r.fileSize = entity.fileSize;
		r.fileType = entity.fileType;
		r.folder = entity.folder;
		r.format = entity.format;
		r.publicId = entity.publicId;
		r.uploadedBy = (entity as any).uploadedBy ?? null;
		r.createdAt = entity.createdAt as any;
		r.updatedAt = entity.updatedAt as any;
		return r;
	}

	static fromEntities(entities: AttachmentEntity[]): AttachmentResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
