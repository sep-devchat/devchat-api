import { AttachmentEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AttachmentRepository extends BaseRepository<AttachmentEntity> {
	constructor(datasource: DataSource) {
		super(AttachmentEntity, datasource.createEntityManager());
	}
}
