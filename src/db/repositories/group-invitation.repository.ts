import { GroupInvitationEntity } from "@db/entities/group-invitation.entity";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GroupInvitationRepository extends BaseRepository<GroupInvitationEntity> {
	constructor(dataSource: DataSource) {
		super(GroupInvitationEntity, dataSource.createEntityManager());
	}
}
